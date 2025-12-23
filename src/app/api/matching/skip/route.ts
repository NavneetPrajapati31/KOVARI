import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { skipperId, skippedUserId, destinationId, type = "solo" } = body;

    if (!skipperId || !skippedUserId || !destinationId) {
      console.error("Skip API: Missing parameters", {
        skipperId,
        skippedUserId,
        destinationId,
      });
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      console.error("Skip API: Missing Supabase environment variables");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
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

    const skipperUuid = await resolve(skipperId);
    const skippedUuid = await resolve(skippedUserId);
    if (!skipperUuid || !skippedUuid) {
      console.error("Skip API: Failed to resolve UUIDs", {
        skipperId,
        skippedUserId,
        skipperUuid,
        skippedUuid,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Could not resolve user identifiers to UUIDs",
        },
        { status: 400 }
      );
    }

    // Prevent duplicate skip
    const { data: existing } = await supabaseAdmin
      .from("match_skips")
      .select("id")
      .eq("user_id", skipperUuid)
      .eq("skipped_user_id", skippedUuid)
      .eq("destination_id", destinationId)
      .eq("match_type", type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already skipped this profile",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("match_skips")
      .insert([
        {
          user_id: skipperUuid,
          skipped_user_id: skippedUuid,
          destination_id: destinationId,
          match_type: type,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Skip API: Database insert error", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { success: false, error: error.message || String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      skipId: data?.id,
    });
  } catch (error: any) {
    console.error("Skip API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create skip record",
      },
      { status: 500 }
    );
  }
}
