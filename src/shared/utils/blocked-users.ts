import { createClient } from "@/lib/supabase";

export const checkBlockStatus = async (
  targetId: string
): Promise<{ iBlockedThem: boolean; theyBlockedMe: boolean }> => {
  const response = await fetch(`/api/users/block?targetId=${targetId}`, {
    method: "GET",
  });
  if (!response.ok) {
    // If unauthorized or error, default to false to avoid UI lockup, or throw
    console.error("Failed to check block status");
    return { iBlockedThem: false, theyBlockedMe: false };
  }
  return response.json();
};

// Deprecated in favor of checkBlockStatus for AuthUser vs Target checks
export const isUserBlocked = async (
  blockerId: string,
  blockedId: string
): Promise<boolean> => {
   // Note: This function is hard to migrate to API without knowing who is "Me".
   // If the caller is checking "Me vs Target", use checkBlockStatus.
   // If checking "Target vs Me", use checkBlockStatus.
   // For now, we'll try to guess based on context or fall back to Supabase client if needed,
   // BUT since we want to fix RLS issues, we should rely on the API which uses Auth context.
   // However, we cannot easily map arbitrary IDs to "Me" without knowing who "Me" is.

   // Strategy: In the components (chat page, dropdown), we KNOW who is who.
   // So update the components to use checkBlockStatus.
   // Leave this function for now as a fallback or if used purely client-side with proper RLS.
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blocked_users")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  if (error) {
      console.warn("isUserBlocked RLS/Network error, defaulting to false", error);
      return false; 
  }
  return !!data?.id;
};

export const blockUser = async (
  blockerId: string,
  blockedId: string
): Promise<void> => {
  const response = await fetch("/api/users/block", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      targetId: blockedId,
      action: "block",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to block user");
  }
};

export const unblockUser = async (
  blockerId: string,
  blockedId: string
): Promise<void> => {
  const response = await fetch("/api/users/block", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      targetId: blockedId,
      action: "unblock",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to unblock user");
  }
};
