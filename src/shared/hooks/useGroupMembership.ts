import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export interface MembershipInfo {
  isCreator: boolean;
  isMember: boolean;
  isAdmin: boolean;
  membership: {
    id: string;
    role: string;
    status: string;
    joined_at: string;
  } | null;
}

export const useGroupMembership = (groupId: string) => {
  const { user } = useUser();
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembership = useCallback(async () => {
    if (!user || !groupId) return;

    try {
      setLoading(true);
      setError(null);

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
    } catch (err) {
      console.error("Error fetching membership:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch membership info"
      );
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  return {
    membershipInfo,
    loading,
    error,
    refetch: fetchMembership,
  };
};
