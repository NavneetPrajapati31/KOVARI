import { GroupCard } from "./GroupCard";
import { useUserGroups } from "@/shared/hooks/useUserGroups";

interface GroupListProps {
  title?: string;
}

export function GroupList({ title = "Groups" }: GroupListProps) {
  const { groups, loading } = useUserGroups();

  return (
    <div className="w-full mx-auto bg-transparent rounded-none shadow-none overflow-y-auto hide-scrollbar h-[330px]">
      <div className="space-y-3">
        {loading ? (
          <div className="text-foreground">Loading...</div>
        ) : (
          groups.map((g) =>
            g.group ? (
              <GroupCard
                key={g.group.id}
                group={{
                  id: g.group.id,
                  name: g.group.name,
                  members: g.group.members_count,
                  destination: g.group.destination || "",
                  imageUrl: g.group.cover_image || undefined,
                  timestampOrTag: g.group.start_date || undefined,
                }}
              />
            ) : null
          )
        )}
      </div>
    </div>
  );
}
