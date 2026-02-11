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
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const isUuid = uuidRegex.test(identifier);
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq(isUuid ? "id" : "clerk_user_id", identifier)
        .eq("isDeleted", false)
        .maybeSingle();
      if (error) throw error;
      return data?.id || null;
    };

    const skipperUuid = await resolve(skipperId);
    if (!skipperUuid) {
      console.error("Skip API: Failed to resolve skipper UUID", {
        skipperId,
        skipperUuid,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Could not resolve skipper identifier to UUID",
        },
        { status: 400 }
      );
    }

    let skippedEntityId: string;
    
    if (type === "group") {
      // For group skips, skippedUserId is already a group UUID
      // After migration, match_skips.skipped_user_id can store both user and group IDs
      skippedEntityId = skippedUserId;
      console.log("Processing group skip", {
        skipperUuid,
        groupId: skippedEntityId,
        destinationId,
      });
    } else {
      // For solo skips, resolve the user ID
      const skippedUuid = await resolve(skippedUserId);
      if (!skippedUuid) {
        console.error("Skip API: Failed to resolve skipped user UUID", {
          skippedUserId,
        });
        return NextResponse.json(
          {
            success: false,
            error: "Could not resolve skipped user identifier to UUID",
          },
          { status: 400 }
        );
      }
      skippedEntityId = skippedUuid;
    }

    // Check for duplicate skip
    const { data: existing } = await supabaseAdmin
      .from("match_skips")
      .select("id")
      .eq("user_id", skipperUuid)
      .eq("skipped_user_id", skippedEntityId)
      .eq("destination_id", destinationId)
      .eq("match_type", type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: `Already skipped this ${type === "group" ? "group" : "profile"}`,
      });
    }

    // Insert skip record (works for both solo and group)
    const { data, error } = await supabaseAdmin
      .from("match_skips")
      .insert([
        {
          user_id: skipperUuid,
          skipped_user_id: skippedEntityId,
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
        type,
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
