// apps/admin/app/api/admin/users/[id]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { logAdminAction } from "@/admin-lib/logAdminAction";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const profileId = id;

    // Get profile to get user_id
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("id", profileId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch admin notes (if admin_notes table exists)
    // For now, we'll use admin_actions with action type "add_note"
    const { data: notes, error } = await supabaseAdmin
      .from("admin_actions")
      .select(
        `
        id,
        admin_id,
        action,
        reason,
        metadata,
        created_at,
        admins:admins!admin_actions_admin_id_fkey(
          email
        )
      `
      )
      .eq("target_type", "user")
      .eq("target_id", profile.user_id)
      .eq("action", "add_note")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin notes:", error);
      return NextResponse.json(
        { error: "Failed to fetch notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (err: unknown) {
    console.error("Admin notes GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { adminId } = await requireAdmin();
    const { id } = await params;
    const profileId = id;
    const body = await req.json();
    const note: string = body.note;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: "Note is required" }, { status: 400 });
    }

    // Get profile to get user_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log as admin action with action type "add_note"
    await logAdminAction({
      adminId,
      targetType: "user",
      targetId: profile.user_id,
      action: "add_note",
      reason: note,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Admin notes POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
