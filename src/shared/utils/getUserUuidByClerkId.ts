import { createClient } from "@/lib/supabase";

export const getUserUuidByClerkId = async (
  clerkId: string
): Promise<string | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkId)
    .single();

  if (error || !data) {
    console.error("Failed to fetch user UUID for Clerk ID:", clerkId, error);
    return null;
  }
  return data.id;
};