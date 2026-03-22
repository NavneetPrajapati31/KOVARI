import { 
  NotificationPriority, 
  NotificationPriorityMap, 
  NotificationType, 
  EntityType 
} from "@/shared/types/notifications";
import { pubClient, connectRedis } from "../socket/redis";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

interface ShouldSendPushParams {
  userId: string;
  type: NotificationType;
  entityId?: string | null;
  entityType?: EntityType;
}

/**
 * Decision engine for push notifications.
 * Optimizes for user attention and avoids spam.
 */
export async function shouldSendPush({
  userId,
  type,
  entityId,
  entityType,
}: ShouldSendPushParams): Promise<boolean> {
  await connectRedis();
  const priority = NotificationPriorityMap[type] || NotificationPriority.LOW;

  // 1. Low priority -> never push
  if (priority === NotificationPriority.LOW) return false;

  // 2. Check if user is already online (Socket.IO + Redis presence)
  const userSocketsKey = `user_socket:${userId}`; 
  const isOnlineCount = await pubClient.sCard(userSocketsKey);
  
  if (isOnlineCount && isOnlineCount > 0) {
    // User is active in-app, skip push to avoid double-alerting
    return false;
  }

  // 3. High priority eligibility (online check passed)
  if (priority === NotificationPriority.HIGH) return true;

  // 4. Medium priority conditional relevance
  if (priority === NotificationPriority.MEDIUM) {
    // Example: Group Join Request (only notify admins/relevant parties)
    if (type === NotificationType.GROUP_JOIN_REQUEST_RECEIVED && entityType === "group" && entityId) {
      return await isUserGroupAdmin(userId, entityId);
    }
    
    // Default for medium if no specific rule: true
    return true;
  }

  return false;
}

/**
 * Helper to check if a user is an admin of a group.
 */
async function isUserGroupAdmin(userId: string, groupId: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  
  // Need to resolve Supabase User UUID from Clerk ID
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();
    
  if (!user) return false;

  const { data: membership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  return membership?.role === "admin" || membership?.role === "owner";
}
