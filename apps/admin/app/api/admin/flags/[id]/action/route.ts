// apps/admin/app/api/admin/flags/[id]/action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { logAdminAction } from "@/admin-lib/logAdminAction";

interface Params {
  params: Promise<{ id: string }>;
}

type FlagAction =
  | "resolve"
  | "dismiss"
  | "warn_user"
  | "ban_user"
  | "suspend_user";

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { adminId } = await requireAdmin();
    const { id } = await params;
    const flagId = id;
    const body = await req.json();
    const action: FlagAction = body.action;
    const reason: string | undefined = body.reason;
    const banUntil: string | undefined = body.banUntil;

    // Load flag
    const { data: flag, error: flagError } = await supabaseAdmin
      .from("user_flags")
      .select("id, user_id, status")
      .eq("id", flagId)
      .maybeSingle();

    if (flagError || !flag) {
      console.error("Flag lookup error:", flagError);
      return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    }

    const userId = flag.user_id as string;

    // Helper: update flag status
    const updateStatus = async (status: string) => {
      const { error } = await supabaseAdmin
        .from("user_flags")
        .update({ status })
        .eq("id", flagId);
      if (error) {
        console.error("Flag status update error:", error);
        throw new Error("Failed to update flag status");
      }
    };

    if (action === "resolve" || action === "dismiss") {
      await updateStatus(action === "resolve" ? "resolved" : "dismissed");

      await logAdminAction({
        adminId,
        targetType: "user_flag",
        targetId: flagId,
        action: action === "resolve" ? "RESOLVE_FLAG" : "DISMISS_FLAG",
        reason,
      });

      return NextResponse.json({ success: true });
    }

    if (action === "warn_user") {
      // you can integrate email or notifications here later
      await updateStatus("resolved");

      await logAdminAction({
        adminId,
        targetType: "user",
        targetId: userId,
        action: "WARN_USER",
        reason,
      });

      return NextResponse.json({ success: true });
    }

    if (action === "ban_user" || action === "suspend_user") {
      const banExpiresAt = action === "suspend_user" ? banUntil : null;

      const { error: banError } = await supabaseAdmin
        .from("users")
        .update({
          banned: true,
          ban_reason: reason ?? `Flag-based ${action}`,
          ban_expires_at: banExpiresAt,
        })
        .eq("id", userId);

      if (banError) {
        console.error("Ban/suspend from flag error:", banError);
        return NextResponse.json(
          { error: "Failed to ban/suspend user" },
          { status: 500 }
        );
      }

      await updateStatus("resolved");

      await logAdminAction({
        adminId,
        targetType: "user",
        targetId: userId,
        action: action === "ban_user" ? "BAN_USER" : "SUSPEND_USER",
        reason,
        metadata: { flagId, ban_expires_at: banExpiresAt },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Flag action error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
