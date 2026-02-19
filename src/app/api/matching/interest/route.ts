import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logMatchEvent, createMatchEventLog } from "@/lib/ai/logging/logMatchEvent";
import { extractFeaturesForSoloMatch } from "@/lib/ai/logging/extract-features-for-logging";
import { getSetting } from "@/lib/settings";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromUserId, toUserId, destinationId } = body;

    if (!fromUserId || !toUserId || !destinationId) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    // Resolve identifiers to UUIDs if needed
    const resolve = async (identifier: string) => {
      // If it's already a UUID, return it
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (uuidRegex.test(identifier)) return identifier;
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", identifier)
        .maybeSingle();
      if (error) throw error;
      return data?.id || null;
    };

    const fromUuid = await resolve(fromUserId);
    const toUuid = await resolve(toUserId);
    if (!fromUuid || !toUuid) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not resolve user identifiers to UUIDs",
        },
        { status: 400 }
      );
    }

    // Prevent duplicate
    const { data: existing } = await supabaseAdmin
      .from("match_interests")
      .select("id")
      .eq("from_user_id", fromUuid)
      .eq("to_user_id", toUuid)
      .eq("destination_id", destinationId)
      .eq("match_type", "solo")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already expressed interest",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("match_interests")
      .insert([
        {
          from_user_id: fromUuid,
          to_user_id: toUuid,
          destination_id: destinationId,
          match_type: "solo",
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || error },
        { status: 500 }
      );
    }

    // Check reverse interest and create match if mutual
    const { data: reverse } = await supabaseAdmin
      .from("match_interests")
      .select("id")
      .eq("from_user_id", toUuid)
      .eq("to_user_id", fromUuid)
      .eq("destination_id", destinationId)
      .eq("match_type", "solo")
      .eq("status", "pending")
      .maybeSingle();

    // Log ML event for interest creation (positive engagement)
    try {
      // Get Clerk IDs for both users
      const { data: fromUser } = await supabaseAdmin
        .from("users")
        .select("clerk_user_id")
        .eq("id", fromUuid)
        .single();
      
      const { data: toUser } = await supabaseAdmin
        .from("users")
        .select("clerk_user_id")
        .eq("id", toUuid)
        .single();

      if (fromUser?.clerk_user_id && toUser?.clerk_user_id) {
        // Get matching preset for logging
        const presetSetting = await getSetting("matching_preset");
        const presetMode = (presetSetting as { mode: string } | null)?.mode || "balanced";

        const features = await extractFeaturesForSoloMatch(
          fromUser.clerk_user_id, // Current user (showing interest)
          toUser.clerk_user_id,    // Target user
          destinationId
        );

        if (features) {
          // Log as "accept" since showing interest is positive engagement
          logMatchEvent(
            createMatchEventLog(
              "user_user",
              features,
              "accept",
              presetMode.toLowerCase()
            )
          );
        }
      }
    } catch (logError) {
      // Don't fail the interest creation if logging fails
      console.error("Error logging interest event:", logError);
    }

    if (reverse) {
      // Update both to accepted
      await supabaseAdmin
        .from("match_interests")
        .update({ status: "accepted" })
        .eq("from_user_id", fromUuid)
        .eq("to_user_id", toUuid)
        .eq("destination_id", destinationId)
        .eq("match_type", "solo");

      await supabaseAdmin
        .from("match_interests")
        .update({ status: "accepted" })
        .eq("from_user_id", toUuid)
        .eq("to_user_id", fromUuid)
        .eq("destination_id", destinationId)
        .eq("match_type", "solo");

      const userA = fromUuid < toUuid ? fromUuid : toUuid;
      const userB = fromUuid < toUuid ? toUuid : fromUuid;

      await supabaseAdmin.from("matches").insert([
        {
          user_a_id: userA,
          user_b_id: userB,
          destination_id: destinationId,
          match_type: "solo",
          status: "active",
        },
      ]);
    }

    return NextResponse.json({ success: true, interestId: data?.id });
  } catch (err: any) {
    console.error("/api/matching/interest error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
