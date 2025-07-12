"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import TravelerCard from "@/features/explore/components/TravelerCard";
import { GroupCard } from "@/features/explore/components/GroupCard";
import {
  fetchSoloTravelers,
  fetchPublicGroups,
  Traveler,
  Group,
} from "@/features/explore/lib/fetchExploreData";
import { GroupCardv2 } from "@/features/explore/components/GroupCardv2";
import { FiltersState } from "@/features/explore/types/filters-state";
import { createClient } from "@/lib/supabase";

type UserStatus = "member" | "pending" | "pending_request" | "blocked" | null;

const PAGE_SIZE = 20;

// Patch Traveler type for filtering (gender, interests optional)
type TravelerWithFilters = Traveler & {
  gender?: string;
  interests?: string[];
};

interface ExploreResultsProps {
  activeTab: number;
  filters: FiltersState;
  onShowLoading?: () => void;
}

export default function ExploreResults({
  activeTab,
  filters,
  onShowLoading,
}: ExploreResultsProps) {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [travelerCursor, setTravelerCursor] = useState<string | null>(null);
  const [groupCursor, setGroupCursor] = useState<string | null>(null);
  const [hasMoreTravelers, setHasMoreTravelers] = useState(true);
  const [hasMoreGroups, setHasMoreGroups] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [isResolvingUserId, setIsResolvingUserId] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Resolve Clerk user ID to internal UUID
  useEffect(() => {
    const resolveUserId = async () => {
      if (!user) {
        setInternalUserId(null);
        setIsResolvingUserId(false);
        return;
      }
      setIsResolvingUserId(true);
      try {
        const supabase = createClient();
        const { data: userRow, error } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", user.id)
          .single();
        if (error || !userRow) {
          setInternalUserId(null);
        } else {
          setInternalUserId(userRow.id);
        }
      } catch (err) {
        setInternalUserId(null);
      } finally {
        setIsResolvingUserId(false);
      }
    };
    if (isLoaded) {
      resolveUserId();
    }
  }, [user, isLoaded]);

  // Reset state on tab/filter/user change
  useEffect(() => {
    setTravelers([]);
    setGroups([]);
    setTravelerCursor(null);
    setGroupCursor(null);
    setHasMoreTravelers(true);
    setHasMoreGroups(true);
    setError(null);
    setIsLoading(true);
  }, [activeTab, filters, internalUserId]);

  // Initial fetch
  useEffect(() => {
    if (!isLoaded || isResolvingUserId) return;
    if (!user || !internalUserId) {
      setError("You must be signed in to view explore results.");
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (activeTab === 0) {
          const { data, nextCursor } = await fetchSoloTravelers(
            internalUserId,
            filters,
            null,
            20
          );
          setTravelers(data);
          setTravelerCursor(nextCursor);
          setHasMoreTravelers(!!nextCursor);
        } else if (activeTab === 1) {
          const { data, nextCursor } = await fetchPublicGroups(
            internalUserId,
            filters,
            null,
            20
          );
          setGroups(data);
          setGroupCursor(nextCursor);
          setHasMoreGroups(!!nextCursor);
        }
      } catch (err) {
        setError("Failed to load explore results.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, filters, user, isLoaded, internalUserId, isResolvingUserId]);

  // Infinite scroll handler
  const handleLoadMore = useCallback(async () => {
    if (isFetchingMore || isLoading || isResolvingUserId) return;
    if (!user || !internalUserId) return;
    if (activeTab === 0 && hasMoreTravelers && travelerCursor) {
      setIsFetchingMore(true);
      try {
        const { data, nextCursor } = await fetchSoloTravelers(
          internalUserId,
          filters,
          travelerCursor,
          20
        );
        setTravelers((prev) => [...prev, ...data]);
        setTravelerCursor(nextCursor);
        setHasMoreTravelers(!!nextCursor);
      } catch (err) {
        setError("Failed to load more results.");
      } finally {
        setIsFetchingMore(false);
      }
    } else if (activeTab === 1 && hasMoreGroups && groupCursor) {
      setIsFetchingMore(true);
      try {
        const { data, nextCursor } = await fetchPublicGroups(
          internalUserId,
          filters,
          groupCursor,
          20
        );
        setGroups((prev) => [...prev, ...data]);
        setGroupCursor(nextCursor);
        setHasMoreGroups(!!nextCursor);
      } catch (err) {
        setError("Failed to load more results.");
      } finally {
        setIsFetchingMore(false);
      }
    }
  }, [
    activeTab,
    user,
    internalUserId,
    travelerCursor,
    groupCursor,
    hasMoreTravelers,
    hasMoreGroups,
    isFetchingMore,
    isLoading,
    isResolvingUserId,
    filters,
  ]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(loadMoreRef.current);
    return () => {
      observer.disconnect();
    };
  }, [handleLoadMore, loadMoreRef, activeTab, travelers, groups]);

  const handleGroupAction = async (
    groupId: string,
    action: "view" | "request" | "join"
  ) => {
    console.log(`Group action: ${action} for group ${groupId}`);

    if (!user) {
      console.error("User not authenticated");
      return;
    }

    try {
      if (action === "view") {
        // Navigate to group page
        window.location.href = `/groups/${groupId}/home`;
        return;
      }

      if (action === "join") {
        // For public groups - direct join
        const response = await fetch(`/api/groups/${groupId}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Join error:", errorText);
          // You could show a toast notification here
          return;
        }

        // Refresh the groups list to update the UI
        window.location.reload();
        return;
      }

      if (action === "request") {
        // For private/invite-only groups - send join request
        const response = await fetch(`/api/groups/${groupId}/join-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Join request error:", errorText);
          // You could show a toast notification here
          return;
        }

        // Refresh the groups list to update the UI
        window.location.reload();
        return;
      }
    } catch (error) {
      console.error("Error performing group action:", error);
      // You could show a toast notification here
    }
  };

  if (!isLoaded || isLoading) {
    const skeletonCount =
      PAGE_SIZE - (activeTab === 0 ? travelers.length : groups.length);
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 justify-items-start">
          {Array.from({
            length: skeletonCount > 0 ? skeletonCount : PAGE_SIZE,
          }).map((_, i) =>
            activeTab === 0 ? (
              <TravelerCard
                key={i}
                traveler={{
                  id: "",
                  name: "",
                  username: "",
                  age: 0,
                  bio: "",
                  profilePhoto: "",
                  destination: "",
                  travelDates: "",
                  matchStrength: "medium",
                }}
                isLoading={true}
                travelerUserId={""}
                initialIsFollowing={false}
              />
            ) : (
              <GroupCard
                key={i}
                group={{} as Group}
                onAction={handleGroupAction}
                isLoading={true}
              />
            )
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  return (
    <div className="w-full mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 justify-items-start">
        {activeTab === 0 ? (
          travelers.length > 0 ? (
            travelers
              .filter(
                (traveler) =>
                  !(
                    typeof (traveler as any).isFollowing === "boolean" &&
                    (traveler as any).isFollowing
                  )
              )
              .map((traveler) => (
                <TravelerCard
                  key={traveler.id}
                  traveler={traveler}
                  isLoading={false}
                  travelerUserId={traveler.userId}
                  initialIsFollowing={
                    typeof (traveler as any).isFollowing === "boolean"
                      ? (traveler as any).isFollowing
                      : false
                  }
                />
              ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No travelers found.
            </div>
          )
        ) : (
          (() => {
            // Filter out groups where userStatus === 'member' or user is the creator
            const notJoinedOrCreatedGroups = groups.filter(
              (group) =>
                group.userStatus !== "member" && group.creatorId !== user?.id
            );
            return notJoinedOrCreatedGroups.length > 0 ? (
              notJoinedOrCreatedGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onAction={handleGroupAction}
                  isLoading={false}
                  onShowLoading={onShowLoading}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No groups found.
              </div>
            );
          })()
        )}
      </div>
      {/* Infinite scroll sentinel */}
      {(activeTab === 0 ? hasMoreTravelers : hasMoreGroups) && (
        <div ref={loadMoreRef} className="w-full flex justify-center py-8">
          {isFetchingMore && (
            <span className="text-muted-foreground">Loading more...</span>
          )}
        </div>
      )}
    </div>
  );
}
