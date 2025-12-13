// apps/admin/lib/logAdminAction.ts
import { supabaseAdmin } from "./supabaseAdmin";

export async function logAdminAction(params: {
  adminId: string;
  targetType: string;
  targetId?: string | null;
  action: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { adminId, targetType, targetId, action, reason, metadata } = params;

  const { error } = await supabaseAdmin.from("admin_actions").insert([
    {
      admin_id: adminId,
      target_type: targetType,
      target_id: targetId ?? null,
      action,
      reason: reason ?? null,
      metadata: metadata ?? {},
    },
  ]);

  if (error) {
    console.error("Failed to log admin action:", error);
  }
}
