import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reporterId, reportedUserId, reason, type = "solo" } = body;

    if (!reporterId || !reportedUserId || !reason) {
      console.error("Report API: Missing parameters", {
        reporterId,
        reportedUserId,
        reason,
      });
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      console.error("Report API: Missing Supabase environment variables");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Validate reason
    const validReasons = [
      "fake_profile",
      "inappropriate_content",
      "spam",
      "harassment",
      "other",
    ];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { success: false, error: "Invalid report reason" },
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

    const reporterUuid = await resolve(reporterId);
    const reportedUuid = await resolve(reportedUserId);
    if (!reporterUuid || !reportedUuid) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not resolve user identifiers to UUIDs",
        },
        { status: 400 }
      );
    }

    // Prevent duplicate report
    const { data: existing } = await supabaseAdmin
      .from("match_reports")
      .select("id")
      .eq("reporter_id", reporterUuid)
      .eq("reported_user_id", reportedUuid)
      .eq("match_type", type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Report already submitted",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("match_reports")
      .insert([
        {
          reporter_id: reporterUuid,
          reported_user_id: reportedUuid,
          reason,
          match_type: type,
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Report API: Database insert error", {
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
      reportId: data?.id,
    });
  } catch (error: any) {
    console.error("Report API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create report",
      },
      { status: 500 }
    );
  }
}
