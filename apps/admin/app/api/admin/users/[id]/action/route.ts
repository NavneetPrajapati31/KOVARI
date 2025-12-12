// apps/admin/app/api/admin/users/[id]/action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { logAdminAction } from "@/admin-lib/logAdminAction";

interface Params {
  params: Promise<{ id: string }>;
}

type UserAction = "verify" | "ban" | "suspend" | "unban";

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { adminId } = await requireAdmin();
    const { id } = await params;
    const profileId = id;
    const body = await req.json();
    const action: UserAction = body.action;
    const reason: string | undefined = body.reason;
    const banUntil: string | undefined = body.banUntil;

    // 1) find profile to get user_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, verified")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile lookup error:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const userId = profile.user_id as string;

    if (action === "verify") {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ verified: true })
        .eq("id", profileId);

      if (error) {
        console.error("Verify error:", error);
        return NextResponse.json(
          { error: "Failed to verify user" },
          { status: 500 }
        );
      }

      await logAdminAction({
        adminId,
        targetType: "user",
        targetId: userId,
        action: "verify_user",
        reason,
      });

      return NextResponse.json({ success: true });
    }

    if (action === "ban" || action === "suspend") {
      // Convert datetime-local format to ISO string for proper storage
      let banExpiresAt: string | null = null;
      if (action === "suspend" && banUntil) {
        // datetime-local gives format like "2024-01-01T12:00"
        // Convert to ISO string with timezone
        const date = new Date(banUntil);
        if (isNaN(date.getTime())) {
          return NextResponse.json(
            { error: "Invalid date format" },
            { status: 400 }
          );
        }
        banExpiresAt = date.toISOString();
      }

      const { error } = await supabaseAdmin
        .from("users")
        .update({
          banned: true,
          ban_reason: reason ?? `Admin ${action}`,
          ban_expires_at: banExpiresAt,
        })
        .eq("id", userId);

      if (error) {
        console.error("Ban/suspend error:", error);
        return NextResponse.json(
          { error: "Failed to ban/suspend user" },
          { status: 500 }
        );
      }

      await logAdminAction({
        adminId,
        targetType: "user",
        targetId: userId,
        action: action === "ban" ? "ban_user" : "suspend_user",
        reason,
        metadata: { ban_expires_at: banExpiresAt },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "unban") {
      const { error } = await supabaseAdmin
        .from("users")
        .update({
          banned: false,
          ban_reason: null,
          ban_expires_at: null,
        })
        .eq("id", userId);

      if (error) {
        console.error("Unban error:", error);
        return NextResponse.json(
          { error: "Failed to unban user" },
          { status: 500 }
        );
      }

      await logAdminAction({
        adminId,
        targetType: "user",
        targetId: userId,
        action: "unban_user",
        reason,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Admin user action error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
