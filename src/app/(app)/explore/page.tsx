"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs"; // 👈 Import Clerk user hook
import { ExploreHeader } from "@/features/explore/components/ExploreHeader";
import { GroupCard } from "@/features/explore/components/GroupCard";
import { SoloMatchCard } from "@/features/explore/components/SoloMatchCard";
import { Spinner } from "@heroui/react";

// Define the search data interface
interface SearchData {
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
      newSearchData.startDate.getTime() !== lastSearchData.startDate.getTime() ||
      newSearchData.endDate.getTime() !== lastSearchData.endDate.getTime()
    );
  };

  // ✅ Enhanced Search handler that handles both solo and group matching based on active tab
  const handleSearch = async (searchData: SearchData) => {
    // NEW: Check if search data has actually changed
    if (!hasSearchDataChanged(searchData)) {
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
            destinationName: searchData.destination,
            budget: searchData.budget,
            startDate: searchData.startDate.toISOString().split('T')[0],
            endDate: searchData.endDate.toISOString().split('T')[0]
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
            user: match.user,
            is_solo_match: true // Flag to identify solo matches
          }));
          
          setMatchedGroups(soloMatchesAsGroups);
          setCurrentGroupIndex(0);
          
          // NEW: Store the search data
          setLastSearchData(searchData);
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

        // Store all matched groups and start with the first one (highest score)
        setMatchedGroups(data.groups || []);
        setCurrentGroupIndex(0);
        
        // NEW: Store the search data
        setLastSearchData(searchData);
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
      <div className="flex flex-col w-full min-h-screen relative">
        <ExploreHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onDropdownOpenChange={memoizedOnDropdownOpenChange}
          onSearch={handleSearch}
        />

        {/* Error Display */}
        {searchError && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{searchError}</p>
          </div>
        )}

        {/* Results Display */}
        {matchedGroups.length > 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
            {/* Navigation arrows */}
            {matchedGroups.length > 1 && (
              <>
                <button
                  onClick={handlePreviousGroup}
                  disabled={currentGroupIndex === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-3 hover:bg-background/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Previous match"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={handleNextGroup}
                  disabled={currentGroupIndex === matchedGroups.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-3 hover:bg-background/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Next match"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Current match - either group or solo */}
            {activeTab === 0 ? (
              // Solo Travelers
              <SoloMatchCard
                key={matchedGroups[currentGroupIndex].id}
                match={matchedGroups[currentGroupIndex]}
                onConnect={async (matchId) => {
                  console.log("Connecting with solo traveler:", matchId);
                  // TODO: Implement connection logic
                }}
                onViewProfile={(userId) => {
                  console.log("Viewing profile:", userId);
                  // TODO: Navigate to user profile
                }}
              />
            ) : (
              // Groups
              <GroupCard
                key={matchedGroups[currentGroupIndex].id}
                group={matchedGroups[currentGroupIndex]}
                onAction={async (groupId, action) => {
                  console.log("Group action:", action, "for group:", groupId);
                  // TODO: Implement group action logic
                }}
              />
            )}
            
            {/* Match counter */}
            {matchedGroups.length > 1 && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <span>{currentGroupIndex + 1}</span>
                <span>of</span>
                <span>{matchedGroups.length}</span>
                <span>{activeTab === 0 ? 'travelers' : 'groups'}</span>
              </div>
            )}
          </div>
        )}

        {/* No Results Message */}
        {!searchLoading && !searchError && matchedGroups.length === 0 && lastSearchData && (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or dates to find more travel companions.
              </p>
              <div className="text-sm text-gray-500">
                <p>Destination: {lastSearchData.destination}</p>
                <p>Budget: ₹{lastSearchData.budget.toLocaleString()}</p>
                <p>Dates: {lastSearchData.startDate.toLocaleDateString()} - {lastSearchData.endDate.toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!searchLoading && !searchError && matchedGroups.length === 0 && !lastSearchData && (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start your search</h3>
              <p className="text-gray-600">
                Enter your travel details above to find compatible travel companions.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
