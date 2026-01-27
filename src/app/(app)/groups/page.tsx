"use client";

import { Button } from "@/shared/components/ui/button";

// Update the imports at the top
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { GroupCard } from "@/features/explore/components/GroupCard";
import GroupCardSkeleton from "@/features/explore/components/GroupCardSkeleton";
import { fetchMyGroups, Group } from "@/features/explore/lib/fetchExploreData";
import { MyGroupCard } from "@/features/groups/components/MyGroupCard";
import { Loader2 } from "lucide-react";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";

const SKELETON_COUNT = 16;

export default function GroupsPage() {
  const { user, isLoaded } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPageRedirecting, setIsPageRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      if (!isLoaded) return;
      if (!user) {
        setGroups([]);
        setIsLoading(false);
        setHasError(false);
        return;
      }
      setIsLoading(true);
      setHasError(false);
      try {
        const { data } = await fetchMyGroups(user.id, SKELETON_COUNT);
        setGroups(data);
      } catch (error) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, [user, isLoaded]);

  const handleGroupAction = async (
    groupId: string,
    action: "view" | "request" | "join"
  ) => {
    // Implement group action logic (navigate, request, join, etc.)
    // For now, just log
    console.log(`Group action: ${action} for group ${groupId}`);
  };

  return (
    <div className="flex-1 space-y-0 p-4 pt-0 w-full min-h-screen relative">
      <header className="mb-0 flex gap-2 sticky top-0 z-50 bg-background py-4">
        <Button
          variant="outline"
          className="text-xs sm:text-sm text-primary bg-primary-light font-semibold rounded-2xl shadow-sm hover:bg-primary-light hover:text-primary border border-primary pointer-events-none cursor-default"
        >
          My Groups
        </Button>
        <Button
          onClick={() => router.push("/create-group")}
          className="text-xs sm:text-sm text-foreground bg-card border border-border font-semibold rounded-2xl shadow-none"
        >
          New group
        </Button>
      </header>
      {/* {isPageRedirecting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-card">
          <Spinner variant="spinner" size="sm" color="primary" />
        </div>
      )} */}
      {isLoading ? (
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 justify-items-start">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <GroupCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : hasError ? (
        <div className="text-center text-red-500 py-8" role="alert">
          Failed to load groups. Please try again.
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          You haven&apos;t joined any groups yet.
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 justify-items-start">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onAction={handleGroupAction}
                isLoading={false}
                onShowLoading={() => setIsPageRedirecting(true)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
