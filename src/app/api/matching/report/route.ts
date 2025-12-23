import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reporterId, reportedUserId, reason, type = "solo", evidenceUrl, evidencePublicId } = body;

    // Normalize evidenceUrl
    const normalizedEvidenceUrl = 
      evidenceUrl && typeof evidenceUrl === "string" && evidenceUrl.trim() 
        ? evidenceUrl.trim() 
        : null;

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
    if (!reason.trim()) {
      return NextResponse.json(
        { success: false, error: "Report reason cannot be empty" },
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
    let targetUuid = reportedUserId;
    
    // Validating reporter
    if (!reporterUuid) {
       return NextResponse.json(
        { success: false, error: "Invalid reporter ID" },
        { status: 400 }
      );
    }

    // For solo matches, resolve the target user ID
    if (type === "solo") {
       targetUuid = await resolve(reportedUserId);
       if (!targetUuid) {
        return NextResponse.json(
          { success: false, error: "Invalid target user ID" },
          { status: 400 }
        );
       }

       // Check duplicate in user_flags
       const { data: existing } = await supabaseAdmin
         .from("user_flags")
         .select("id")
         .eq("reporter_id", reporterUuid)
         .eq("user_id", targetUuid)
         .maybeSingle();

       if (existing) {
         return NextResponse.json({
           success: true,
           message: "User already reported",
         });
       }

       // Insert into user_flags
       const { data, error } = await supabaseAdmin
         .from("user_flags")
         .insert([
           {
             reporter_id: reporterUuid,
             user_id: targetUuid,
             reason,
             status: "pending",
             evidence_url: normalizedEvidenceUrl,
             evidence_public_id: evidencePublicId || null,
           },
         ])
         .select("id")
         .single();

       if (error) throw error;
       return NextResponse.json({ success: true, reportId: data.id });
       
    } else {
       // Group type
       // Assuming reportedUserId is the Group ID (already a UUID)
       // Check duplicate in group_flags
       const { data: existing } = await supabaseAdmin
         .from("group_flags")
         .select("id")
         .eq("reporter_id", reporterUuid)
         .eq("group_id", targetUuid)
         .maybeSingle();

       if (existing) {
         return NextResponse.json({
           success: true,
           message: "Group already reported",
         });
       }

       // Insert into group_flags
       const { data, error } = await supabaseAdmin
         .from("group_flags")
         .insert([
           {
             reporter_id: reporterUuid,
             group_id: targetUuid,
             reason,
             status: "pending",
             evidence_url: normalizedEvidenceUrl,
             evidence_public_id: evidencePublicId || null,
           },
         ])
         .select("id")
         .single();

       if (error) throw error;
       return NextResponse.json({ success: true, reportId: data.id });
    }
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
