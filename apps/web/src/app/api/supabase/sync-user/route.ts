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

    // 2. Atomic Identity Sync (Consolidated Source of Truth)
    // This RPC handles find-or-create atomically and handles concurrent requests.
    // It also intentionally does NOT create a profile, enforcing onboarding-driven flow.
    const { data: userIdFromRpc, error: syncError } = await supabase
      .rpc("sync_user_identity", {
        p_email: email,
        p_name: (clerkUser.firstName || "") + " " + (clerkUser.lastName || ""),
        p_clerk_id: userId,
        p_google_id: null,
        p_password_hash: null,
      });

    if (syncError || !userIdFromRpc) {
      console.error("[api/supabase/sync-user] Atomic identity sync failed:", syncError);
      return NextResponse.json({ error: "Identity resolution failed" }, { status: 500 });
    }

    // 3. Final Check (Optional: check for soft deletion)
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select('id, "isDeleted"')
      .eq("id", userIdFromRpc)
      .single();

    if (fetchError || !user) {
      console.error("[api/supabase/sync-user] Post-sync verification failed", fetchError);
      return NextResponse.json({ error: "Failed to verify synced identity" }, { status: 500 });
    }

    if (user.isDeleted === true) {
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


