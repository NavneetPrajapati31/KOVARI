import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";

export interface GroupMember {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  role: string;
  joined_at: string;
}

export const useGroupMembers = (groupId: string) => {
  const { user } = useUser();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/groups/${groupId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }

      const data = await response.json();
      setMembers(data);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
};
