"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExploreHeader } from "@/features/explore/components/ExploreHeader";

import { Loader2 } from "lucide-react";
import { Spinner } from "@heroui/react";
import { GroupCard } from "@/features/explore/components/GroupCard";

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper to get tab index from searchParams
  const getTabIndex = () => {
    const tab = searchParams.get("tab");
    if (tab === "groups") return 1;
    return 0;
  };

  const [activeTab, setActiveTab] = useState(getTabIndex);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [matchedGroups, setMatchedGroups] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Sync activeTab with URL changes
  useEffect(() => {
    const tabIndex = getTabIndex();
    if (activeTab !== tabIndex) {
      setActiveTab(tabIndex);
    }
  }, [searchParams]);

  const handleTabChange = (index: number) => {
    if (index !== activeTab) {
      setActiveTab(index);
      let newTab = "travelers";
      if (index === 1) newTab = "groups";
      router.push(`/explore?tab=${newTab}`, { scroll: false });
    }
  };

  const memoizedOnDropdownOpenChange = useCallback(setIsFilterDropdownOpen, []);

  useEffect(() => {
    if (isPageLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Clean up on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPageLoading]);

  const handleSearch = async (searchData: {
    destination: string;
    budget: number;
    startDate: Date;
    endDate: Date;
  }) => {
    setSearchLoading(true);
    setSearchError(null);
    setMatchedGroups([]);
    try {
      const res = await fetch("/api/match-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: searchData.destination,
          budget: searchData.budget,
          startDate: searchData.startDate,
          endDate: searchData.endDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch groups");
      setMatchedGroups(data.groups || []);
    } catch (err: any) {
      setSearchError(err.message || "Unknown error");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <>
      {(isPageLoading || searchLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-card h-screen">
          <Spinner variant="spinner" size="md" color="primary" />
        </div>
      )}
      <div className="flex flex-col w-full min-h-screen relative">
        <ExploreHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onDropdownOpenChange={memoizedOnDropdownOpenChange}
          onSearch={handleSearch}
        />
        <div
          className={`w-full flex-1 px-4 transition-[filter,opacity] duration-500 ease-in-out ${
            isFilterDropdownOpen
              ? "blur-md opacity-80 pointer-events-none select-none"
              : "blur-0 opacity-100"
          }`}
        >
          {searchError ? (
            <div className="flex items-center justify-center h-full text-destructive text-lg">
              {searchError}
            </div>
          ) : matchedGroups.length > 0 ? (
            <div className="flex flex-col items-center gap-6 py-8">
              {matchedGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={{
                    ...group,
                    memberCount: group.members_count,
                    privacy: group.is_public ? 'public' : 'private',
                    dateRange: {
                      start: new Date(group.start_date),
                      end: group.end_date ? new Date(group.end_date) : undefined,
                      isOngoing: !group.end_date,
                    },
                    creator: group.creator || { name: 'Unknown', username: 'unknown', avatar: '' },
                  }}
                  onAction={async () => {}}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-lg">
              No results to display.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
