import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";

export type Invite = {
  id: string;
  group_id: string;
  group: {
    name: string;
    destination: string;
    trip_dates: { from: string; to: string };
  };
};

export function usePendingInvites() {
  const { user } = useUser();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvites = async () => {
      if (!user) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("group_invites")
        .select("id, group_id, group:groups(name, destination, trip_dates)")
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (!error && data) {
        const parsed = data.map((invite: any) => ({
          ...invite,
          group: Array.isArray(invite.group) ? invite.group[0] : invite.group,
        }));
        setInvites(parsed);
      }

      setLoading(false);
    };

    fetchInvites();
  }, [user]);

  return { invites, loading };
}
