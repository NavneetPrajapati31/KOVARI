/**
 * API endpoint to sync Clerk user to Supabase
 * Uses service role key to bypass RLS policies
 * 
 * POST /api/users/sync
 * Body: { clerkUserId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const { userId: authenticatedUserId } = await auth();
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clerkUserId } = body;

    // Verify the user is syncing their own account
    if (clerkUserId !== authenticatedUserId) {
      return NextResponse.json(
        { error: "Forbidden: Can only sync your own account" },
        { status: 403 }
      );
    }

    // 1. Fetch user email from Clerk (Identity source of truth)
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(clerkUserId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || 
                  clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      console.error("[SYNC] No email found for Clerk user:", clerkUserId);
      return NextResponse.json({ error: "Email required for identity resolution" }, { status: 400 });
    }

    // Use service role key to bypass RLS
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    // 2. Multi-step Identity Lookup
    // Step A: Check if clerk_user_id already exists
    let { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, clerk_user_id, email, name")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error checking user existence by Clerk ID:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Step B: If not found by Clerk ID, check by email (Cross-platform link)
    if (!existingUser) {
      console.log(`[SYNC] User ${email} not found by Clerk ID. Checking by email (case-insensitive)...`);
      const { data: emailUser, error: emailError } = await supabase
        .from("users")
        .select("id, clerk_user_id, email, name")
        .ilike("email", email) // Case-insensitive match (Task 4/5)
        .maybeSingle();

      if (emailError) {
        console.error("Error checking user existence by email:", emailError);
      }

      if (emailUser) {
        console.log(`[SYNC] Found existing user by email (ID: ${emailUser.id}). Linking clerk_user_id...`);
        // Task 2: Link Clerk ID to existing user
        const { data: linkedUser, error: linkError } = await supabase
          .from("users")
          .update({ clerk_user_id: clerkUserId })
          .eq("id", emailUser.id)
          .select("id, email, name")
          .single();

        if (linkError) {
          console.error("Failed to link Clerk ID to existing user:", linkError);
          return NextResponse.json({ error: "Failed to link identity" }, { status: 500 });
        }
        existingUser = linkedUser as any;
      }
    }

    // If user exists (either already linked or just linked)
    if (existingUser) {
      // 2.1 Sync/Fix Profile Data (Task 8: Fix dummy emails)
      // Ensure the profile table has the correct email and name from users table
      const { error: profileSyncError } = await supabase
        .from("profiles")
        .upsert({
          user_id: existingUser.id,
          email: existingUser.email, // Overwrite dummy email with real one
          name: existingUser.name || clerkUser.firstName + " " + clerkUser.lastName,
        }, { onConflict: "user_id" });

      if (profileSyncError) {
        console.error("[SYNC] Failed to sync profile data:", profileSyncError);
      }

      return NextResponse.json({
        success: true,
        userId: existingUser.id,
        created: false,
      });
    }

    // 3. Create new user with both email and clerk_user_id
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({ 
        clerk_user_id: clerkUserId,
        email: email,
        name: clerkUser.firstName + " " + clerkUser.lastName
      })
      .select("id")
      .single();

    if (insertError || !newUser) {
      console.error("Failed to create unified user:", insertError);
      return NextResponse.json({ error: "User creation failed" }, { status: 500 });
    }

    // 4. Initialize Profile for new user
    await supabase
      .from("profiles")
      .insert({
        user_id: newUser.id,
        email: email,
        name: clerkUser.firstName + " " + clerkUser.lastName,
      });

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      created: true,
    });

  } catch (error) {
    console.error("Error in /api/users/sync:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

