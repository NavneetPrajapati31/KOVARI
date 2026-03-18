/**
 * API endpoint to sync Clerk user to Supabase
 * Uses service role key to bypass RLS policies
 * 
 * POST /api/users/sync
 * Body: { clerkUserId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteHandlerSupabaseClientWithServiceRole } from "../../../../lib/supabase";

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

    // Use service role key to bypass RLS
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error checking user existence:", fetchError);
      return NextResponse.json(
        { error: "Database error", details: fetchError.message },
        { status: 500 }
      );
    }

    // If user exists, return their UUID
    if (existingUser) {
      return NextResponse.json({
        success: true,
        userId: existingUser.id,
        created: false,
      });
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({ clerk_user_id: clerkUserId })
      .select("id")
      .single();

    if (insertError || !newUser) {
      // Check if it's a duplicate key error (race condition)
      if (insertError?.code === '23505') {
        // User was created by another request, fetch it
        const { data: fetchedUser } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", clerkUserId)
          .maybeSingle();
        
        if (fetchedUser) {
          return NextResponse.json({
            success: true,
            userId: fetchedUser.id,
            created: false, // Already existed
          });
        }
      }

      console.error("Failed to create user in Supabase:", insertError);
      return NextResponse.json(
        { 
          error: "Failed to create user", 
          details: insertError?.message || "Unknown error" 
        },
        { status: 500 }
      );
    }

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
