"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { GroupCardv2 } from "@/features/explore/components/GroupCardv2";
import GroupCardSkeleton from "@/features/explore/components/GroupCardSkeleton";
import { fetchMyGroups, Group } from "@/features/explore/lib/fetchExploreData";
import { MyGroupCard } from "@/features/groups/components/MyGroupCard";
import { GroupCard } from "@/features/explore/components/GroupCard";
import { Loader2 } from "lucide-react";
import { Spinner } from "@heroui/react";

const SKELETON_COUNT = 16;

export default function GroupsPage() {
  const { user, isLoaded } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPageRedirecting, setIsPageRedirecting] = useState(false);

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
    <>
      {isPageRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-card h-screen">
          {/* <Loader2 className="w-11 h-11 animate-spin text-black" /> */}
          <Spinner variant="spinner" size="md" color="primary" />
        </div>
      )}
      <div className="flex-1 space-y-4 p-4 w-full min-h-screen relative">
        <header className="mb-0">
          <h1
            className="text-md font-bold tracking-tight text-foreground"
            tabIndex={0}
            aria-label="Groups"
          >
            My Groups
          </h1>
        </header>
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
            You haven't joined any groups yet.
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
    </>
  );
}
