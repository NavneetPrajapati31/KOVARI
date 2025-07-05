import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";

export type PendingInvite = {
  id: string;
  group_id: string;
  group: {
    name: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
};

export function usePendingInvites() {
  const { user } = useUser();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvites = async () => {
      if (!user) return;

      const userUuid = await getUserUuidByClerkId(user.id);
      if (!userUuid) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("group_memberships")
        .select(
          "id, group_id, group:groups(name, destination, start_date, end_date)"
        )
        .eq("user_id", userUuid)
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching pending invites:", error);
        return;
      }

      if (data) {
        setInvites(
          data.map((item: any) => ({
            id: item.id,
            group_id: item.group_id,
            group: Array.isArray(item.group)
              ? (item.group[0] ?? null)
              : item.group,
          }))
        );
      }

      setLoading(false);
    };

    fetchInvites();
  }, [user]);

  return { invites, loading };
}
