// apps/admin/lib/logAdminAction.ts
import { supabaseAdmin } from "./supabaseAdmin";

export async function logAdminAction({
  admin_id,
  target_type,
  target_id,
  action,
  reason = null,
  metadata = {},
}: {
  admin_id: string;
  target_type: string;
  target_id?: string | null;
  action: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("admin_actions").insert([
      { admin_id, target_type, target_id, action, reason, metadata },
    ]);
  } catch (err) {
    console.error("Failed to log admin action", err);
  }
}
