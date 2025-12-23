"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/shared/components/ui/button";
import { ExploreSidebar } from "@/features/explore/components/ExploreSidebar";
import { ResultsDisplay } from "@/features/explore/components/ResultsDisplay";
import { SearchData, Filters } from "@/features/explore/types";

const EXPLORE_TABS = [
  { label: "Solo Travel", value: "solo" },
  { label: "Group Travel", value: "groups" },
] as const;

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  // Get pre-filled destination from URL
  const getPrefilledDestination = () => {
    return searchParams.get("destination") || "";
  };

  // Get tab index from URL
  const getTabIndex = useCallback(() => {
    const tab = searchParams.get("tab");
    if (tab === "groups") return 1;
    return 0; // Default to solo
  }, [searchParams]);

  // State management - initialize from URL
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    if (tab === "groups") return 1;
    return 0;
  });

  // Sync activeTab with URL params
  useEffect(() => {
    const tabIndex = getTabIndex();
    if (activeTab !== tabIndex) {
      setActiveTab(tabIndex);
    }
  }, [searchParams, getTabIndex, activeTab]);
  const [matchedGroups, setMatchedGroups] = useState<any[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearchData, setLastSearchData] = useState<SearchData | null>(null);

  // Search form state
  const [searchData, setSearchData] = useState<SearchData>({
    destination: getPrefilledDestination(),
    budget: 20000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    travelMode: "solo",
  });

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    ageRange: [18, 65],
    gender: "Any",
    interests: [],
    travelStyle: "Any",
    budgetRange: [5000, 50000],
    personality: "Any",
    smoking: "No",
    drinking: "No",
    nationality: "Any",
    languages: [],
  });

  // Update destination when URL changes
  useEffect(() => {
    const newDestination = getPrefilledDestination();
    if (newDestination && newDestination !== searchData.destination) {
      setSearchData((prev) => ({ ...prev, destination: newDestination }));
    }
  }, [searchParams, searchData.destination]);

  // Sync travelMode with activeTab when it changes
  useEffect(() => {
    setSearchData((prev) => ({
      ...prev,
      travelMode: activeTab === 0 ? "solo" : "group",
    }));
  }, [activeTab]);

  // Handle tab change with URL sync
  const handleTabChange = useCallback(
    (index: number) => {
      if (index !== activeTab) {
        setActiveTab(index);
        const tabValue = EXPLORE_TABS[index].value;
        router.push(`/explore?tab=${tabValue}`, { scroll: false });
      }
    },
    [activeTab, router]
  );

  // Keyboard navigation for tabs
  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleTabChange((activeTab + 1) % EXPLORE_TABS.length);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleTabChange(
          (activeTab - 1 + EXPLORE_TABS.length) % EXPLORE_TABS.length
        );
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleTabChange(index);
      } else if (event.key === "Home") {
        event.preventDefault();
        handleTabChange(0);
      } else if (event.key === "End") {
        event.preventDefault();
        handleTabChange(EXPLORE_TABS.length - 1);
      }
    },
    [activeTab, handleTabChange]
  );

  // Tab buttons with groups layout styling
  const tabButtons = useMemo(
    () =>
      EXPLORE_TABS.map((tab, idx) => (
        <Button
          key={tab.value}
          variant={"outline"}
          className={`text-xs sm:text-sm ${
            activeTab === idx
              ? "text-primary bg-primary-light font-semibold rounded-2xl shadow-sm hover:bg-primary-light hover:text-primary border-1 border-primary"
              : "text-foreground/80 font-semibold bg-transparent rounded-2xl hover:text-primary"
          }`}
          onClick={() => handleTabChange(idx)}
          onKeyDown={(e) => handleTabKeyDown(e, idx)}
        >
          {tab.label}
        </Button>
      )),
    [activeTab, handleTabChange, handleTabKeyDown]
  );

  // Helper function to check if search data has changed
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

  const handleSearch = () => {
    const fullSearchData: SearchData = {
      ...searchData,
      travelMode: activeTab === 0 ? "solo" : "group",
    };

    if (!hasSearchDataChanged(fullSearchData)) {
      console.log("Search data unchanged, skipping search");
      return;
    }

    performSearch(fullSearchData);
  };

  const performSearch = async (fullSearchData: SearchData) => {
    console.log("Starting search with data:", fullSearchData);
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
          const errorData = await sessionResponse.json().catch(() => ({}));
          const errorMessage = errorData.message || "Failed to create session";
          const errorHint = errorData.hint || "";

          // Provide helpful error message based on error type
          if (
            errorData.error === "PROFILE_NOT_FOUND" ||
            errorData.error === "PROFILE_INCOMPLETE"
          ) {
            throw new Error(
              `${errorMessage}${errorHint ? ` ${errorHint}` : ""}`
            );
          }

          throw new Error(errorMessage);
        }

        // Add a small delay to ensure Redis session is fully committed
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Step 2: Get solo matches using enhanced matching
        const soloMatchesRes = await fetch(`/api/match-solo?userId=${userId}`);
        if (soloMatchesRes.ok) {
          const soloMatches = await soloMatchesRes.json();
          console.log("Solo matches found:", soloMatches.length);

          // Convert solo matches to group-like format for display
          const soloMatchesAsGroups = soloMatches.map(
            (match: any, index: number) => ({
              id: `solo-${index}`,
              name: `${match.user.name || match.user.full_name || "Traveler"} - ${match.destination}`,
              destination: match.destination,
              budget: match.user.budget || "Not specified",
              start_date: fullSearchData.startDate,
              end_date: fullSearchData.endDate,
              compatibility_score: Math.round(match.score * 100),
              budget_difference: match.budgetDifference,
              user: {
                ...match.user,
                interests:
                  Array.isArray(match.commonInterests) &&
                  match.commonInterests.length > 0
                    ? match.commonInterests
                    : match.user?.interests,
              },
              is_solo_match: true,
            })
          );

          setMatchedGroups(soloMatchesAsGroups);
          setCurrentGroupIndex(0);
          setLastSearchData(fullSearchData);
        } else {
          const errorData = await soloMatchesRes.json();
          throw new Error(errorData.message || "Failed to fetch solo matches");
        }
      } else {
        // GROUP TRAVEL MODE - Only search for groups with filter data
        console.log("Searching for groups with filters:", filters);
        const requestBody = {
          destination: fullSearchData.destination,
          budget: fullSearchData.budget,
          startDate: fullSearchData.startDate.toISOString().split("T")[0],
          endDate: fullSearchData.endDate.toISOString().split("T")[0],
          userId: userId,
          // Include filter data for better matching
          age: filters.ageRange[0], // Use minimum age as default
          languages: filters.languages,
          interests: filters.interests,
          smoking: filters.smoking === "Yes",
          drinking: filters.drinking === "Yes",
          nationality:
            filters.nationality !== "Any" ? filters.nationality : "Unknown",
        };

        console.log("Request body for group search:", requestBody);

        const res = await fetch("/api/match-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        console.log("Response status:", res.status);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch groups");

        console.log("API Response for groups:", data);

        // Transform the API response to match GroupMatchCard's expected format
        const transformedGroups = (data.groups || []).map((group: any) => ({
          id: group.id,
          name: group.name,
          privacy: "public" as const,
          destination: group.destination,
          startDate: group.startDate,
          endDate: group.endDate,
          budget: group.budget,
          memberCount: group.members || 0,
          userStatus: "Open",
          creator: {
            name: group.creator?.name || "Unknown",
            username: group.creator?.username || "unknown",
            avatar: group.creator?.avatar || undefined,
          },
          cover_image: group.cover_image || undefined,
          description: group.description || undefined,
          // Add matching score and breakdown for display
          score: group.score,
          breakdown: group.breakdown,
          distance: group.distance,
          tags: group.tags || [],
        }));

        console.log("Transformed groups:", transformedGroups);

        setMatchedGroups(transformedGroups);
        setCurrentGroupIndex(0);
        setLastSearchData(fullSearchData);
      }
    } catch (err: any) {
      setSearchError(err.message || "Unknown error");
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Reset search data when tab changes
  useEffect(() => {
    setLastSearchData(null);
    setMatchedGroups([]);
    setCurrentGroupIndex(0);
    setSearchError(null);
  }, [activeTab]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Navigation functions
  const handlePreviousGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
    }
  };

  const handleNextGroup = () => {
    if (currentGroupIndex < matchedGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else if (matchedGroups.length > 0) {
      // No more matches - clear the results to show "no more matches" message
      console.log("No more matches available");
      setMatchedGroups([]);
      setCurrentGroupIndex(0);
    }
  };

  // Action handlers
  const handleConnect = async (matchId: string) => {
    console.log("Connecting with solo traveler:", matchId);
    // TODO: Implement connection logic
  };

  const handleSuperLike = async (matchId: string) => {
    console.log("Super liking solo traveler:", matchId);
    // TODO: Implement super like logic
  };

  const handlePass = async (matchId: string) => {
    console.log("handlePass: Skipping match and moving to next", {
      matchId,
      currentIndex: currentGroupIndex,
      totalMatches: matchedGroups.length,
    });
    // Move to next match after skipping
    handleNextGroup();
    console.log("handlePass: Next group index is now:", currentGroupIndex + 1);
  };

  const handleComment = async (
    matchId: string,
    attribute: string,
    comment: string
  ) => {
    console.log(
      "Commenting on",
      attribute,
      "for traveler:",
      matchId,
      "Comment:",
      comment
    );
    // TODO: Implement comment logic
  };

  const handleViewProfile = (userId: string) => {
    if (!userId) return;
    router.push(`/profile/${userId}`);
  };

  const handleJoinGroup = async (groupId: string) => {
    console.log("Joining group:", groupId);
    // TODO: Implement join group logic
  };

  const handleRequestJoin = async (groupId: string) => {
    console.log("Requesting to join group:", groupId);
    // TODO: Implement request join logic
  };

  const handlePassGroup = async (groupId: string) => {
    console.log("Passing on group:", groupId);
    // TODO: Implement pass logic - move to next group
    handleNextGroup();
  };

  const handleViewGroup = (groupId: string) => {
    console.log("Viewing group:", groupId);
    // TODO: Navigate to group details
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-full mx-auto flex flex-col gap-4">
        {/* Tabs Header - Outside containers like groups layout */}
        <header>
          <div className="flex gap-2 flex-shrink-0">{tabButtons}</div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-3 h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)] lg:h-[calc(100vh-10rem)]">
          {/* Left Sidebar - Rounded Container */}
          <div className="w-full md:w-[400px] lg:w-[420px] flex-shrink-0 rounded-3xl bg-card border-1 border-border overflow-hidden flex flex-col">
            <ExploreSidebar
              activeTab={activeTab}
              searchData={searchData}
              filters={filters}
              searchLoading={searchLoading}
              onSearchDataChange={setSearchData}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Right Content Area - Rounded Container */}
          <div className="flex-1 bg-card rounded-3xl border-1 border-border overflow-hidden flex flex-col">
            <ResultsDisplay
              activeTab={activeTab}
              matchedGroups={matchedGroups}
              currentGroupIndex={currentGroupIndex}
              searchLoading={searchLoading}
              searchError={searchError}
              lastSearchData={lastSearchData}
              currentUserId={user?.id}
              destinationId={searchData.destination}
              onPreviousGroup={handlePreviousGroup}
              onNextGroup={handleNextGroup}
              onConnect={handleConnect}
              onSuperLike={handleSuperLike}
              onPass={handlePass}
              onComment={handleComment}
              onViewProfile={handleViewProfile}
              onJoinGroup={handleJoinGroup}
              onRequestJoin={handleRequestJoin}
              onPassGroup={handlePassGroup}
              onViewGroup={handleViewGroup}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
