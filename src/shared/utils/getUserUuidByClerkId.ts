import { createClient, createClientWithAuth } from "@/lib/supabase";

export const getUserUuidByClerkId = async (
  clerkId: string,
  supabaseToken?: string | null,
): Promise<string | null> => {
  // If no token was provided (common in older call-sites), fall back to the
  // server sync endpoint which uses the service role key.
  // This avoids client-side RLS issues + removes the need to thread tokens everywhere.
  try {
    if (
      !supabaseToken &&
      typeof window !== "undefined" &&
      typeof fetch !== "undefined"
    ) {
      const res = await fetch("/api/supabase/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const body = (await res.json()) as { ok?: boolean; userId?: string };
        if (body?.userId) return body.userId;
      }
    }
  } catch (e) {
    // ignore and try the direct Supabase query
  }

  const supabase = supabaseToken
    ? createClientWithAuth(supabaseToken)
    : createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkId)
    .eq("isDeleted", false)
    .maybeSingle();

  if (error || !data) {
    // console.error("Failed to fetch user UUID for Clerk ID:", {
    //   clerkId,
    //   code: error?.code,
    //   message: error?.message,
    //   details: (error as any)?.details,
    //   hint: (error as any)?.hint,
    // });
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
