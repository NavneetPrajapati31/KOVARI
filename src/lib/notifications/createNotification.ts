import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  CreateNotificationParams,
  NotificationType,
} from "@/shared/types/notifications";

/**
 * Server-only function to create a notification.
 * Must be called from API routes or server actions, never from client.
 * Uses service role to bypass RLS.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const {
      userId,
      type,
      title,
      message,
      entityType = null,
      entityId = null,
    } = params;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return {
        success: false,
        error:
          "Missing required fields: userId, type, title, and message are required",
      };
    }

    // Validate notification type
    const validTypes = Object.values(NotificationType);
    if (!validTypes.includes(type)) {
      return {
        success: false,
        error: `Invalid notification type: ${type}. Must be one of: ${validTypes.join(", ")}`,
      };
    }

    // Insert notification using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        entity_type: entityType,
        entity_id: entityId,
        is_read: false,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return {
        success: false,
        error: error.message || "Failed to create notification",
      };
    }

    return {
      success: true,
      notificationId: data.id,
    };
  } catch (error: any) {
    console.error("Exception in createNotification:", error);
    return {
      success: false,
      error: error?.message || "Unexpected error creating notification",
    };
  }
}
