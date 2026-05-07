import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createAdminSupabaseClient } from "@kovari/api";
import {
  formatStandardResponse,
  formatErrorResponse,
} from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";

/**
 * PATCH /api/notifications/[id]
 * Mark a specific notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const start = Date.now();
  const requestId = "update-notif";
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return formatErrorResponse(
        "Unauthorized",
        ApiErrorCode.UNAUTHORIZED,
        requestId,
        401
      );
    }

    const { id } = await params;
    const userId = authUser.id;
    const supabase = createAdminSupabaseClient();

    // Update notification (RLS will ensure user can only update their own)
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating notification:", error);
      return formatErrorResponse(
        "Failed to update notification",
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        requestId,
        500
      );
    }

    if (!data) {
      return formatErrorResponse(
        "Notification not found",
        ApiErrorCode.NOT_FOUND,
        requestId,
        404
      );
    }

    return formatStandardResponse(
      { notification: data },
      {},
      { requestId, latencyMs: Date.now() - start }
    );
  } catch (error: any) {
    console.error("Exception in PATCH /api/notifications/[id]:", error);
    return formatErrorResponse(
      "Internal server error",
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      "update-notif",
      500
    );
  }
}
