// apps/admin/app/api/admin/groups/[id]/action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { logAdminAction } from "@/admin-lib/logAdminAction";
import {
  categorizeRemovalReason,
  handleOrganizerTrustImpact,
} from "@/admin-lib/groupSafetyHandler";

interface Params {
  params: Promise<{ id: string }>;
}

type GroupAction = "approve" | "remove";

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { adminId } = await requireAdmin();
    const { id } = await params;
    const groupId = id;
    const body = await req.json();
    const action: GroupAction = body.action;
    const reason: string | undefined = body.reason;
    const fromFlagFlow: boolean = body.fromFlagFlow || false; // Indicates if action comes from flag flow

    // Validate action
    if (action !== "approve" && action !== "remove") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Require reason for remove action
    if (action === "remove" && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: "Reason is required for remove action" },
        { status: 400 }
      );
    }

    // Rate limit destructive actions (remove, approve)
    // Prevent rapid repeated actions on the same group
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("admin_actions")
      .select("id")
      .eq("admin_id", adminId)
      .eq("target_id", groupId)
      .eq("target_type", "group")
      .eq("action", action === "remove" ? "REMOVE_GROUP" : "APPROVE_GROUP")
      .gt("created_at", oneMinuteAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      return NextResponse.json(
        { error: "Please wait before repeating this action" },
        { status: 429 }
      );
    }

    // Get current group data for metadata
    const { data: currentGroup, error: fetchError } = await supabaseAdmin
      .from("groups")
      .select(
        "name, status, flag_count, members_count, destination, creator_id"
      )
      .eq("id", groupId)
      .maybeSingle();

    if (fetchError || !currentGroup) {
      console.error("Group lookup error:", fetchError);
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const previousStatus = currentGroup.status;
    const previousFlagCount = currentGroup.flag_count || 0;
    const organizerId = currentGroup.creator_id;

    // Prepare update object
    const updateData: Record<string, unknown> = {};

    if (action === "approve") {
      updateData.status = "active";
    } else if (action === "remove") {
      updateData.status = "removed";
      updateData.removed_reason = reason?.trim() || null;
      updateData.removed_at = new Date().toISOString();
    }

    // Increment flag_count if action comes from flag flow
    if (fromFlagFlow) {
      updateData.flag_count = previousFlagCount + 1;
    }

    const { error } = await supabaseAdmin
      .from("groups")
      .update(updateData)
      .eq("id", groupId);

    if (error) {
      console.error("Group action error:", error);
      return NextResponse.json(
        { error: "Failed to update group" },
        { status: 500 }
      );
    }

    // Prepare metadata
    const metadata: Record<string, unknown> = {
      groupName: currentGroup.name,
      previousStatus,
      newStatus: updateData.status,
      flagCount: previousFlagCount,
      membersCount: currentGroup.members_count || 0,
      destination: currentGroup.destination,
    };

    if (fromFlagFlow) {
      metadata.fromFlagFlow = true;
      metadata.newFlagCount = previousFlagCount + 1;
    }

    // Handle safety & abuse logic for remove actions
    if (action === "remove" && reason && organizerId) {
      const severity = categorizeRemovalReason(reason);
      metadata.removalSeverity = severity;
      metadata.isHardRemove = severity === "hard-remove";

      // Handle organizer trust impact
      await handleOrganizerTrustImpact(organizerId, severity, adminId, groupId);
    }

    // Always log admin action
    await logAdminAction({
      adminId,
      targetType: "group",
      targetId: groupId,
      action: action === "approve" ? "APPROVE_GROUP" : "REMOVE_GROUP",
      reason,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Group action error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
