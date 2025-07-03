// src/shared/hooks/useUserGroups.ts
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";

type Group = {
  group_id: string;
  group: {
    name: string;
    destination: string;
    trip_dates: {
      from: string;
      to: string;
    };
  } | null;
};

export function useUserGroups() {
  const { user } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("group_memberships")
        .select("group_id, group:groups(name, destination, trip_dates)")
        .eq("user_id", user.id);

        if (!error) {
            setGroups(
              (data || []).map((item: any) => ({
                group_id: item.group_id,
                group: item.group?.[0] ?? null,
              }))
            );
          }
      setLoading(false);
    };

    fetchGroups();
  }, [user]);

  return { groups, loading };
}
