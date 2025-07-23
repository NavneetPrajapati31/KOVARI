"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs"; // 👈 Import Clerk user hook
import { ExploreHeader } from "@/features/explore/components/ExploreHeader";
import { GroupCard } from "@/features/explore/components/GroupCard";
import { Spinner } from "@heroui/react";

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser(); // 👈 Clerk user

  // Helper to get tab index from URL
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
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

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
    document.body.style.overflow = isPageLoading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPageLoading]);

  // ✅ Search handler that stores session + fetches groups
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
      // Step 1: Store dynamic session (for solo matching)
      const userId = user?.id;
      if (userId) {
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            destination: searchData.destination,
            budget: searchData.budget,
            mode: "solo",
            date: searchData.startDate.toLocaleDateString("en-CA"), // ✅ Local-safe format
          }),
        });    
      }

      // Step 2: Group match search (Kaju's original logic)
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

  const sortedGroups = useMemo(() => {
    return [...matchedGroups].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [matchedGroups]);

  useEffect(() => {
    // Reset to first group when matchedGroups change
    setCurrentGroupIndex(0);
  }, [matchedGroups]);

  const currentGroup = sortedGroups[currentGroupIndex] || null;

  return (
    <>
      {(isPageLoading || searchLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-card h-screen">
          <Spinner variant="spinner" size="md" color="primary" />
        </div>
      )}
      <div className="flex flex-col w-full relative">
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
          {activeTab === 1 ? (
            searchError ? (
              <div className="flex items-center justify-center h-full text-destructive text-lg">
                {searchError}
              </div>
            ) : sortedGroups.length > 0 ? (
              <div className="flex flex-col items-center gap-6 py-2">
                <div className="flex items-center gap-4">
                  <button
                    className="p-2 rounded-full bg-muted hover:bg-accent disabled:opacity-50"
                    onClick={() => setCurrentGroupIndex(i => Math.max(0, i - 1))}
                    disabled={currentGroupIndex === 0}
                    aria-label="Previous group"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  {currentGroup && (
                    <GroupCard
                      key={currentGroup.id}
                      group={{
                        ...currentGroup,
                        memberCount: currentGroup.members_count,
                        privacy: currentGroup.is_public ? 'public' : 'private',
                        dateRange: {
                          start: new Date(currentGroup.start_date),
                          end: currentGroup.end_date ? new Date(currentGroup.end_date) : undefined,
                          isOngoing: !currentGroup.end_date,
                        },
                        creator: currentGroup.creator || { name: 'Unknown', username: 'unknown', avatar: '' },
                      }}
                      onAction={async () => {}}
                    />
                  )}
                  <button
                    className="p-2 rounded-full bg-muted hover:bg-accent disabled:opacity-50"
                    onClick={() => setCurrentGroupIndex(i => Math.min(sortedGroups.length - 1, i + 1))}
                    disabled={currentGroupIndex === sortedGroups.length - 1}
                    aria-label="Next group"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {sortedGroups.length > 1 && `Group ${currentGroupIndex + 1} of ${sortedGroups.length}`}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-lg">
                No results to display.
              </div>
            )
          ) : null}
        </div>
      </div>
    </>
  );
}
