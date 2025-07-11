import { createClient } from "@/lib/supabase";

export const isUserBlocked = async (
  blockerId: string,
  blockedId: string
): Promise<boolean> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blocked_users")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  if (error) throw error;
  return !!data?.id;
};

export const blockUser = async (
  blockerId: string,
  blockedId: string
): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase.from("blocked_users").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  if (error) throw error;
};

export const unblockUser = async (
  blockerId: string,
  blockedId: string
): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
};
