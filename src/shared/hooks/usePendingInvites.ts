import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";

export type GroupMembership = {
  id: string;
  group_id: string;
  user_id: string;
  status: "pending" | "pending_request" | "accepted" | "declined";
  invited_at: string | null;
  joined_at: string | null;
  role: "admin" | "member";
  group: {
    id: string;
    name: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    cover_image: string | null;
    members_count: number;
    is_public: boolean | null;
    creator_id: string;
    created_at: string;
  };
};

export function usePendingInvites() {
  const { user } = useUser();
  const [invites, setInvites] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvites = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get the internal Supabase user_id from the clerk_user_id
        const userUuid = await getUserUuidByClerkId(user.id);
        if (!userUuid) {
          setError("User not found in database.");
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data, error: supabaseError } = await supabase
          .from("group_memberships")
          .select(
            `
            id,
            group_id,
            user_id,
            status,
            invited_at,
            joined_at,
            role,
            group:groups(
              id,
              name,
              destination,
              start_date,
              end_date,
              description,
              cover_image,
              members_count,
              is_public,
              creator_id,
              created_at
            )
          `
          )
          .eq("user_id", userUuid)
          .in("status", ["pending"]);

        if (supabaseError) {
          console.error("Error fetching pending invites:", supabaseError);
          setError(`Database error: ${supabaseError.message}`);
          setLoading(false);
          return;
        }

        if (data) {
          const parsed = data.map((invite: any) => ({
            ...invite,
            group: Array.isArray(invite.group) ? invite.group[0] : invite.group,
          }));
          setInvites(parsed);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error in fetchInvites:", error);
        setError("Failed to fetch pending invites");
        setLoading(false);
      }
    };

    fetchInvites();
  }, [user]);

  return { invites, loading, error };
}
