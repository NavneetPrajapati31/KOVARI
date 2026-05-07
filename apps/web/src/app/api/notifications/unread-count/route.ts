import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createAdminSupabaseClient } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications for the current user
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();

  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);
    }

    const userId = authUser.id;
    const supabase = createAdminSupabaseClient();

    // Count unread notifications
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error counting unread notifications:", error);
      return formatErrorResponse("Failed to count notifications", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }

    return formatStandardResponse({ count: count || 0 }, {}, { requestId, latencyMs: Date.now() - start });
  } catch (error: any) {
    console.error("Exception in GET /api/notifications/unread-count:", error);
    return formatErrorResponse("Internal server error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}


