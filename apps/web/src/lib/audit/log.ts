import { createAdminSupabaseClient } from "@kovari/api";

export type AuditAction = 
  | "AUTH_LOGIN_ATTEMPT"
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGOUT"
  | "ACCOUNT_DELETED"
  | "PROFILE_UPDATED"
  | "REPORT_FILED"
  | "ADMIN_ACTION";

export interface AuditLogParams {
  action: AuditAction;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * Writes a security audit log to the database.
 * Does not block execution (fire and forget) to avoid impacting performance.
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  // Fire and forget, but catch errors to prevent unhandled rejections
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from("audit_logs").insert([
      {
        action: params.action,
        actor_id: params.actorId || null,
        target_id: params.targetId || null,
        target_type: params.targetType || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        details: params.details || {},
      },
    ]);

    if (error) {
      console.error("Failed to write audit log:", error);
    }
  } catch (error) {
    console.error("Exception in writeAuditLog:", error);
  }
}
