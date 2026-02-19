import { createClient } from "@/lib/supabase";

export const getUserUuidByClerkId = async (
  clerkId: string
): Promise<string | null> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkId)
      .maybeSingle(); // Use maybeSingle() to handle missing users gracefully

    if (error) {
      // Only log if it's not a "not found" error (PGRST116)
      if (error.code !== 'PGRST116') {
        console.warn("Failed to fetch user UUID for Clerk ID:", clerkId, error.message);
      }
      return null;
    }

    if (!data) {
      // User not found in database - this is normal for new users who haven't completed onboarding
      return null;
    }

    return data.id;
  } catch (error) {
    // Handle unexpected errors gracefully
    console.warn("Error fetching user UUID:", error instanceof Error ? error.message : String(error));
    return null;
  }
};