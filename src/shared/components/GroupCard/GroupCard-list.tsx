import { GroupCard } from "./GroupCard"
import { useUserGroups } from "@/shared/hooks/useUserGroups"

interface GroupListProps {
  title?: string
}

export function GroupList({ title = "Groups" }: GroupListProps) {
  const { groups, loading } = useUserGroups();

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-xl shadow-2xl h-[400px] overflow-y-auto hide-scrollbar">
      <h2 className="text-2xl font-bold text-black mb-4 sm:text-3xl">{title}</h2>
      <div className="space-y-3">
        {loading ? (
          <div className="text-white">Loading...</div>
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
  )
}
