import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[api/supabase/sync-user] Missing server env", {
      hasUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  try {
    // 1. Fetch user from Clerk (Identity source of truth)
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || 
                  clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      console.error("[api/supabase/sync-user] No email found for Clerk user", userId);
      return NextResponse.json({ error: "Email required for identity resolution" }, { status: 400 });
    }

    console.log(`[SYNC-USER] Starting identity resolution for Clerk user: ${userId} (${email})`);

    // 2. Identity Resolution
    // Attempt A: Match by Clerk ID
    let { data: user, error: fetchError } = await supabase
      .from("users")
      .select('id, "isDeleted", clerk_user_id, name, email')
      .eq("clerk_user_id", userId)
      .maybeSingle();

    // Attempt B: Link by email if not found by Clerk ID
    if (!user && !fetchError) {
      console.log(`[SYNC-USER] User ${email} not found by Clerk ID. Attempting case-insensitive email match...`);
      const { data: matchedUser, error: matchError } = await supabase
        .from("users")
        .select('id, "isDeleted", clerk_user_id, name, email')
        .ilike("email", email) 
        .maybeSingle();

      if (matchError) {
        console.error("[api/supabase/sync-user] Email match error", matchError);
      }

      if (matchedUser) {
        console.log(`[SYNC-USER] Match found for ${email} (ID: ${matchedUser.id}). Linking identities...`);
        const { data: linkedUser, error: linkError } = await supabase
          .from("users")
          .update({ clerk_user_id: userId })
          .eq("id", matchedUser.id)
          .select('id, "isDeleted", clerk_user_id, name, email')
          .single();

        if (linkError) {
          console.error("[api/supabase/sync-user] Link failed", linkError);
          return NextResponse.json({ error: "Failed to link identity" }, { status: 500 });
        }
        user = linkedUser;
      } else {
        console.log(`[SYNC-USER] No existing user found for email: ${email}`);
      }
    }

    // Attempt C: Create new user if still not found
    if (!user) {
      console.log(`[SYNC-USER] Creating new user record for ${email}...`);
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({ 
          clerk_user_id: userId,
          email: email,
          name: (clerkUser.firstName || "") + " " + (clerkUser.lastName || "")
        })
        .select('id, "isDeleted", clerk_user_id, name, email')
        .single();

      if (createError) {
        console.error("[api/supabase/sync-user] Creation failed", createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      user = newUser;
    }

    if (fetchError) {
      console.error("[api/supabase/sync-user] Fetch failed", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to resolve user" }, { status: 500 });
    }

    // 3. Clean up Profile Data (Avoid dummy emails and satisfy NOT NULL constraints)
    // Generate a default username if profile is new or missing it
    const defaultUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") + "_" + Math.floor(Math.random() * 1000);
    
    // Check if profile exists first to avoid overwriting existing usernames
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username, email, name")
      .eq("user_id", user.id)
      .maybeSingle();

    console.log(`[SYNC-USER] Profile check for ${user.id}: ${existingProfile ? "Existing" : "New"}`);

    const profileUpsertData: any = {
      user_id: user.id,
      email: email, // Fix dummy email (OVERWRITE placeholder)
      name: user.name || (clerkUser.firstName || "") + " " + (clerkUser.lastName || ""),
    };

    // We MUST include the username in the upsert if we want to satisfy the NOT NULL constraint on INSERT
    // If it's an update, it's safer to include it too to handle any weirdness with Postgres upserts.
    profileUpsertData.username = existingProfile?.username || defaultUsername;

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileUpsertData, { onConflict: "user_id" });

    if (profileError) {
      console.error("[api/supabase/sync-user] Profile update failed", profileError);
    } else {
       console.log(`[SYNC-USER] Successfully synced profile for ${user.id} (${email})`);
    }

    if ((user as any)?.isDeleted === true) {
      return NextResponse.json(
        { error: "Account has been deleted" },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, userId: user.id }, { status: 200 });
  } catch (e) {
    console.error("[api/supabase/sync-user] Unexpected error", e);
    Sentry.captureException(e, {
      tags: { endpoint: "/api/supabase/sync-user", action: "handler_error" },
      extra: { clerkUserId: userId },
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


