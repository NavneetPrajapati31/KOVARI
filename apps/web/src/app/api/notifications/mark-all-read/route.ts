import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createAdminSupabaseClient } from "@kovari/api";
import {
  formatStandardResponse,
  formatErrorResponse,
} from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = "mark-all-read";
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

    const userId = authUser.id;
    const supabase = createAdminSupabaseClient();

    // Update all unread notifications (RLS will ensure user can only update their own)
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select();

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return formatErrorResponse(
        "Failed to mark notifications as read",
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        requestId,
        500
      );
    }

    return formatStandardResponse(
      { updatedCount: data?.length || 0 },
      {},
      { requestId, latencyMs: Date.now() - start }
    );
  } catch (error: any) {
    console.error("Exception in POST /api/notifications/mark-all-read:", error);
    return formatErrorResponse(
      "Internal server error",
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      "mark-all-read",
      500
    );
  }
}


