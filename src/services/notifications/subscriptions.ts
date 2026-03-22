import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function savePushSubscription(userId: string, subscription: any) {
  const supabase = createAdminSupabaseClient();

  const { endpoint, keys } = subscription;
  
  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert({
      user_id: userId,
      endpoint: endpoint,
      keys_p256dh: keys.p256dh,
      keys_auth: keys.auth,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "endpoint"
    });

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
