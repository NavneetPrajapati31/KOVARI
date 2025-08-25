"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs"; // 👈 Import Clerk user hook
import { ExploreHeader } from "@/features/explore/components/ExploreHeader";
import { GroupCard } from "@/features/explore/components/GroupCard";
import { SoloMatchCard } from "@/features/explore/components/SoloMatchCard";
import { SoloExploreUI } from "@/features/explore/components/SoloExploreUI";
import { Spinner } from "@heroui/react";

// Define the search data interface for SoloExploreUI
interface SearchData {
  destination: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  travelMode: "solo" | "group";
}

// Define the search data interface for ExploreHeader
interface HeaderSearchData {
  destination: string;
  budget: number;
  startDate: Date;
  endDate: Date;
}

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
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // NEW: Track last search data to prevent unnecessary re-searches
  const [lastSearchData, setLastSearchData] = useState<SearchData | null>(null);

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

  // Navigation functions
  const handlePreviousGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
    }
  };

  const handleNextGroup = () => {
    if (currentGroupIndex < matchedGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handlePreviousGroup();
      } else if (event.key === "ArrowRight") {
        handleNextGroup();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentGroupIndex, matchedGroups.length]);

  // Page loading effect
  useEffect(() => {
    document.body.style.overflow = isPageLoading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPageLoading]);

  // NEW: Helper function to check if search data has changed
  const hasSearchDataChanged = (newSearchData: SearchData): boolean => {
    if (!lastSearchData) return true;

    return (
      newSearchData.destination !== lastSearchData.destination ||
      newSearchData.budget !== lastSearchData.budget ||
      newSearchData.startDate.getTime() !==
        lastSearchData.startDate.getTime() ||
      newSearchData.endDate.getTime() !== lastSearchData.endDate.getTime()
    );
  };

  // ✅ Enhanced Search handler that handles both solo and group matching based on active tab
  const handleSearch = async (searchData: HeaderSearchData) => {
    // Convert HeaderSearchData to SearchData by adding travelMode
    const fullSearchData: SearchData = {
      ...searchData,
      travelMode: activeTab === 0 ? "solo" : "group"
    };
    
    // NEW: Check if search data has actually changed
    if (!hasSearchDataChanged(fullSearchData)) {
      console.log("Search data unchanged, skipping search");
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setMatchedGroups([]);
    setCurrentGroupIndex(0);

    try {
      const userId = user?.id;

      if (activeTab === 0) {
        // SOLO TRAVEL MODE - Only search for solo travelers
        if (!userId) {
          throw new Error("Please sign in to search for solo travelers");
        }

        // Step 1: Store enhanced dynamic session (for solo matching)
        const sessionResponse = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            destinationName: fullSearchData.destination,
            budget: fullSearchData.budget,
            startDate: fullSearchData.startDate.toISOString().split("T")[0],
            endDate: fullSearchData.endDate.toISOString().split("T")[0],
            travelMode: fullSearchData.travelMode,
          }),
        });

        if (!sessionResponse.ok) {
          throw new Error("Failed to create session");
        }

        // Step 2: Get solo matches using enhanced matching
        const soloMatchesRes = await fetch(`/api/match-solo?userId=${userId}`);
        if (soloMatchesRes.ok) {
          const soloMatches = await soloMatchesRes.json();
          console.log("Solo matches found:", soloMatches.length);

          // Convert solo matches to group-like format for display
          const soloMatchesAsGroups = soloMatches.map((match: any, index: number) => ({
            id: `solo-${index}`,
            name: `${match.user.name || match.user.full_name || 'Traveler'} - ${match.destination}`,
            destination: match.destination,
            budget: match.user.budget || 'Not specified',
            start_date: searchData.startDate,
            end_date: searchData.endDate,
            compatibility_score: Math.round(match.score * 100),
            budget_difference: match.budgetDifference,
            user: {
              ...match.user,
              // Prefer API-provided commonInterests for shared display
              interests: Array.isArray(match.commonInterests) && match.commonInterests.length > 0
                ? match.commonInterests
                : match.user?.interests
            },
            is_solo_match: true // Flag to identify solo matches
          }));
          
          setMatchedGroups(soloMatchesAsGroups);
          setCurrentGroupIndex(0);

          // NEW: Store the search data
          setLastSearchData(fullSearchData);
        } else {
          const errorData = await soloMatchesRes.json();
          throw new Error(errorData.message || "Failed to fetch solo matches");
        }
      } else {
        // GROUP TRAVEL MODE - Only search for groups
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

        // Transform the API response to match GroupCard's expected format
        const transformedGroups = (data.groups || []).map((group: any) => ({
          id: group.id,
          name: group.name,
          privacy: "public" as const, // Default to public for matched groups
          destination: group.destination,
          dateRange: {
            start: group.startDate ? new Date(group.startDate) : new Date(),
            end: group.endDate ? new Date(group.endDate) : undefined,
            isOngoing: !group.endDate,
          },
          memberCount: group.members || 0,
          userStatus: null, // User is not a member yet
          creator: {
            name: group.creator?.name || "Unknown",
            username: group.creator?.username || "unknown",
            avatar: group.creator?.avatar || undefined,
          },
          cover_image: undefined, // No cover image in matching results
        }));

        // Store all matched groups and start with the first one (highest score)
        setMatchedGroups(transformedGroups);
        setCurrentGroupIndex(0);

        // NEW: Store the search data
        setLastSearchData(fullSearchData);
      }
    } catch (err: any) {
      setSearchError(err.message || "Unknown error");
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // NEW: Reset search data when tab changes
  useEffect(() => {
    setLastSearchData(null);
    setMatchedGroups([]);
    setCurrentGroupIndex(0);
    setSearchError(null);
  }, [activeTab]);

  return (
    <>
      {(isPageLoading || searchLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-card h-screen">
          <Spinner variant="spinner" size="md" color="primary" />
        </div>
      )}
      {/* Use unified SoloExploreUI for both solo and group travel modes */}
      <SoloExploreUI
        onSearchAction={handleSearch}
        matchedGroups={matchedGroups}
        currentGroupIndex={currentGroupIndex}
        onPreviousGroupAction={handlePreviousGroup}
        onNextGroupAction={handleNextGroup}
        searchLoading={searchLoading}
        searchError={searchError}
        lastSearchData={lastSearchData}
        // Pass the active tab to SoloExploreUI so it can show the correct mode
        activeTab={activeTab}
      />
    </>
  );
}
