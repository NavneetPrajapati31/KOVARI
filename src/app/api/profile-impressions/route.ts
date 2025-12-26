/**
 * Profile Impressions API
 *
 * Tracks how many times a user's profile is shown to other users in the explore/matching feature.
 *
 * Database Schema (run this in Supabase SQL Editor):
 *
 * CREATE TABLE IF NOT EXISTS profile_impressions (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   viewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   destination_id TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Indexes for performance
 * CREATE INDEX IF NOT EXISTS idx_profile_impressions_viewed_user ON profile_impressions(viewed_user_id);
 * CREATE INDEX IF NOT EXISTS idx_profile_impressions_viewer_viewed ON profile_impressions(viewer_id, viewed_user_id);
 * CREATE INDEX IF NOT EXISTS idx_profile_impressions_created_at ON profile_impressions(created_at);
 *
 * Note: Daily uniqueness is handled in application code (one impression per viewer-viewed-destination per day)
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// Track profile impressions (when a profile is shown to a user)
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    const body = await request.json();
    const { viewedUserId, destinationId } = body;

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!viewedUserId) {
      return NextResponse.json(
        { error: "viewedUserId is required" },
        { status: 400 }
      );
    }

    // Get the current user's UUID
    const { data: currentUserData, error: currentUserError } =
      await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .single();

    if (currentUserError || !currentUserData) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    const viewerId = currentUserData.id;

    // Don't track self-impressions
    if (viewerId === viewedUserId) {
      return NextResponse.json({
        success: true,
        message: "Self-impression ignored",
      });
    }

    // Check if impression already exists for this viewer-viewed pair today
    // This prevents duplicate impressions from the same user viewing the same profile multiple times in a day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: existingImpression } = await supabaseAdmin
      .from("profile_impressions")
      .select("id")
      .eq("viewer_id", viewerId)
      .eq("viewed_user_id", viewedUserId)
      .eq("destination_id", destinationId || null)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())
      .maybeSingle();

    if (existingImpression) {
      // Impression already tracked today, just return success
      return NextResponse.json({
        success: true,
        message: "Impression already tracked today",
      });
    }

    // Insert new impression
    const { error: insertError } = await supabaseAdmin
      .from("profile_impressions")
      .insert([
        {
          viewer_id: viewerId,
          viewed_user_id: viewedUserId,
          destination_id: destinationId || null,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error("Error inserting profile impression:", insertError);
      return NextResponse.json(
        { error: "Failed to track impression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Get total profile impressions count for current user
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's UUID
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userData.id;

    // Count total impressions where this user's profile was viewed
    const { count, error: countError } = await supabaseAdmin
      .from("profile_impressions")
      .select("id", { count: "exact", head: true })
      .eq("viewed_user_id", userId);

    if (countError) {
      console.error("Error counting impressions:", countError);
      return NextResponse.json(
        { error: "Failed to fetch impressions" },
        { status: 500 }
      );
    }

    const impressionCount = count || 0;
    console.log(
      `📊 Profile impressions count for user ${userId}: ${impressionCount}`
    );

    return NextResponse.json({
      impressions: impressionCount,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
