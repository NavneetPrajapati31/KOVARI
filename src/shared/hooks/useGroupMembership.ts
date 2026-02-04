import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";

export interface MembershipInfo {
  isCreator: boolean;
  isMember: boolean;
  isAdmin: boolean;
  hasPendingRequest: boolean;
  membership: {
    id: string;
    role: string;
    status: string;
    joined_at: string;
  } | null;
}

export const useGroupMembership = (groupId: string) => {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchMembership = useCallback(async () => {
    if (!userId || !groupId) return;

    try {
      setError(null);
      if (!hasLoadedOnce.current) {
        setLoading(true);
      }

      const response = await fetch(`/api/groups/${groupId}/membership`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Not a member of this group");
        }
        if (response.status === 404) {
          throw new Error("Group not found");
        }
        throw new Error("Failed to fetch membership info");
      }

      const data = await response.json();
      setMembershipInfo(data);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error("Error fetching membership:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch membership info"
      );
    } finally {
      setLoading(false);
    }
  }, [groupId, userId]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  // Realtime subscription for instant removal detection (broad group filter for debugging)
  useEffect(() => {
    if (!userId || !groupId) return;
    const supabase = createClient();
    let channel: any;

    channel = supabase
      .channel(`group_membership_${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "group_memberships",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          console.log("[Realtime] ANY Membership UPDATE payload:", payload);
          fetchMembership();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "group_memberships",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          console.log("[Realtime] ANY Membership DELETE payload:", payload);
          fetchMembership();
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, groupId, fetchMembership]);

  return {
    membershipInfo,
    loading,
    error,
    refetch: fetchMembership,
  };
};
