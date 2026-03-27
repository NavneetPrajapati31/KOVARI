import { createAdminSupabaseClient } from "@kovari/api";

export async function savePushSubscription(userId: string, subscription: any) {
  const supabase = createAdminSupabaseClient();

  const { endpoint, keys } = subscription;
  
  // 1. Check if this endpoint already exists
  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("endpoint", endpoint)
    .maybeSingle();

  let result;
  if (existing) {
    // 2. Update existing entry (no updated_at in provided schema)
    result = await supabase
      .from("push_subscriptions")
      .update({
        user_id: userId,
        keys_p256dh: keys.p256dh,
        keys_auth: keys.auth,
      })
      .eq("id", existing.id);
  } else {
    // 3. Insert new entry
    result = await supabase
      .from("push_subscriptions")
      .insert({
        user_id: userId,
        endpoint: endpoint,
        keys_p256dh: keys.p256dh,
        keys_auth: keys.auth,
      });
  }

  const { data, error } = result;

  if (error) {
    console.error("Error saving push subscription:", error);
    throw error;
  }

  return data;
}

export async function getPushSubscriptions(userId: string) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching push subscriptions:", error);
    return [];
  }

  return data;
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("Error deleting push subscription:", error);
  }
}


