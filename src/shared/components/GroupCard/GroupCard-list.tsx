import { GroupCard } from "./GroupCard";
import { useUserGroups } from "@/shared/hooks/useUserGroups";
import { Skeleton } from "@heroui/react";
import { Card } from "@/shared/components/ui/card";

const SKELETON_ROW_COUNT = 7;

/** Skeleton row matching GroupCard layout: avatar, name + destination row, members row */
function GroupCardSkeletonRow() {
  return (
    <Card className="flex flex-row items-center gap-x-2 py-0 bg-card text-foreground shadow-none border-none">
      <div className="flex-shrink-0">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col min-w-0 space-y-1">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
    </Card>
  );
}

export function GroupListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden aria-busy>
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, idx) => (
        <GroupCardSkeletonRow key={idx} />
      ))}
    </div>
  );
}

interface GroupListProps {
  title?: string;
}

export function GroupList({ title = "Groups" }: GroupListProps) {
  const { groups, loading } = useUserGroups();
  const hasGroups = groups.some((g) => g.group != null);

  return (
    <div className="w-full mx-auto bg-transparent rounded-none shadow-none overflow-y-auto hide-scrollbar h-full">
      <div className="space-y-3">
        {loading ? (
          <GroupListSkeleton />
        ) : !hasGroups ? (
          <div className="flex flex-col items-center justify-center min-h-[12rem] text-center px-4">
            <p className="text-xs font-medium text-muted-foreground">
              No joined groups
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create or join a group to get started
            </p>
          </div>
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
