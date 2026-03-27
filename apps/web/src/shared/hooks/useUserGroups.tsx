import { useEffect, useState } from "react";
import { createClientWithAuth , getUserUuidByClerkId } from "@kovari/api/client";
import { useAuth, useUser } from "@clerk/nextjs";

import { Group } from "@kovari/types";
export type { Group };

export function useUserGroups() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ) {
          throw new Error(
            "Supabase environment variables are not configured. Please check your .env.local file."
          );
        }

        const supabaseToken = await getToken({ template: "supabase" });
        if (!supabaseToken) {
          setError("Missing auth token. Please sign in again.");
          setLoading(false);
          return;
        }

        const userUuid = await getUserUuidByClerkId (user.id, supabaseToken);
        if (!userUuid) {
          setError("User not found in database.");
          setLoading(false);
          return;
        }

        const supabase = createClientWithAuth(supabaseToken);
        const { data, error: supabaseError } = await supabase
          .from("group_memberships")
          .select(
            `
            group_id,
            status,
            role,
            group:groups(
              id,
              name,
              destination,
              start_date,
              end_date,
              description,
              cover_image,
              destination_image,
              members_count,
              is_public,
              status
            )
          `
          )
          .eq("user_id", userUuid)
          .eq("status", "accepted");

        // console.log("📦 Supabase GROUPS DATA ===>", data);

        if (supabaseError) {
          console.error("❌ Supabase ERROR:", supabaseError);
          setError(`Database error: ${supabaseError.message}`);
          return;
        }

        if (data) {
          const mapped = data
            .map((item: any) => ({
              group_id: item.group_id,
              status: item.status,
              role: item.role,
              group: Array.isArray(item.group)
                ? (item.group[0] ?? null)
                : item.group,
            }))
            .filter(
              (entry: Group) =>
                entry.group != null && entry.group.status !== "removed"
            );
          setGroups(mapped);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        console.error("❌ Error fetching user groups:", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  return { groups, loading, error };
}
