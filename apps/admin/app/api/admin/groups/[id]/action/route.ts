// apps/admin/app/api/admin/groups/[id]/action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { logAdminAction } from "@/admin-lib/logAdminAction";

interface Params {
  params: { id: string };
}

type GroupAction = "approve" | "reject" | "remove";

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { adminId } = await requireAdmin();
    const groupId = params.id;
    const body = await req.json();
    const action: GroupAction = body.action;
    const reason: string | undefined = body.reason;

    let newStatus: string | null = null;
    if (action === "approve") newStatus = "active";
    if (action === "reject" || action === "remove") newStatus = "removed";

    if (!newStatus) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("groups")
      .update({ status: newStatus })
      .eq("id", groupId);

    if (error) {
      console.error("Group action error:", error);
      return NextResponse.json(
        { error: "Failed to update group" },
        { status: 500 }
      );
    }

    await logAdminAction({
      adminId,
      targetType: "group",
      targetId: groupId,
      action: `group_${action}`,
      reason,
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
