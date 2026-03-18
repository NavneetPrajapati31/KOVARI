import { createClient, createClientWithAuth } from "@/lib/supabase";

/**
 * Helper function to get the Supabase UUID from a Clerk ID
 * Optionally takes a Supabase token for authenticated requests
 */
export const getUserUuidByClerkId = async (
  clerkId: string,
  supabaseToken?: string | null,
): Promise<string | null> => {
  try {
    // 1. If no token provided and on client, attempt to use the sync endpoint as a fallback
    // This handles cases where RLS might block anonymous lookups and we want the cached UUID
    if (
      !supabaseToken &&
      typeof window !== "undefined" &&
      typeof fetch !== "undefined"
    ) {
      try {
        const res = await fetch("/api/supabase/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const body = (await res.json()) as { success?: boolean; userId?: string };
          if (body?.userId) return body.userId;
        }
      } catch (e) {
        // Fallthrough to direct query
      }
    }

    // 2. Direct Supabase query
    const supabase = supabaseToken
      ? createClientWithAuth(supabaseToken)
      : createClient();
      
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkId)
      .eq("isDeleted", false)
      .maybeSingle();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.warn("Failed to fetch user UUID for Clerk ID:", clerkId, error.message);
      }
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error("Error fetching user UUID:", error);
    return null;
  }
};

