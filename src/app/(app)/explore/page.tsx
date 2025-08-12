"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs"; // 👈 Import Clerk user hook
import { ExploreHeader } from "@/features/explore/components/ExploreHeader";
import { GroupCard } from "@/features/explore/components/GroupCard";
import { SoloMatchCard } from "@/features/explore/components/SoloMatchCard";
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
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
      if (matchedGroups.length > 1) {
        if (event.key === 'ArrowLeft') {
          handlePreviousGroup();
        } else if (event.key === 'ArrowRight') {
          handleNextGroup();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentGroupIndex, matchedGroups.length]);

  useEffect(() => {
    document.body.style.overflow = isPageLoading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPageLoading]);

  // ✅ Search handler that handles both solo and group matching based on active tab
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
      const userId = user?.id;
      
      if (activeTab === 0) {
        // SOLO TRAVEL MODE - Only search for solo travelers
        if (!userId) {
          throw new Error("Please sign in to search for solo travelers");
        }

        // Step 1: Store enhanced dynamic session (for solo matching)
        await fetch("/api/session", {
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

        // Step 2: Get solo matches using enhanced matching
        const soloMatchesRes = await fetch(`/api/match-solo?userId=${userId}`);
        if (soloMatchesRes.ok) {
          const soloMatches = await soloMatchesRes.json();
          console.log("Solo matches found:", soloMatches.length);
          
          // Convert solo matches to group-like format for display
          const soloMatchesAsGroups = soloMatches.map((match: any, index: number) => ({
            id: `solo-${index}`,
            name: `${match.user.full_name || 'Traveler'} - ${match.destination}`,
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
        } else {
          throw new Error("Failed to fetch solo matches");
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
          userStatus: null as const, // User is not a member yet
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
      }
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
             <div className="flex flex-col items-center gap-6 py-8 relative">
               {/* Navigation arrows */}
               {matchedGroups.length > 1 && (
                 <>
                   <button
                     onClick={handlePreviousGroup}
                     disabled={currentGroupIndex === 0}
                     className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-3 hover:bg-background/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                     aria-label="Previous group"
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
                     aria-label="Next group"
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
               {matchedGroups[currentGroupIndex].is_solo_match ? (
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
                 <GroupCard
                   key={matchedGroups[currentGroupIndex].id}
                   group={matchedGroups[currentGroupIndex]}
                   onAction={async () => {}}
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
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-lg">
              No matching {activeTab === 0 ? 'travelers' : 'groups'} found. Try adjusting your search criteria.
            </div>
          )}
        </div>
      </div>
    </>
 );
}
