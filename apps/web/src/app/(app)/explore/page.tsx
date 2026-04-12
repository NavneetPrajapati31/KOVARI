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
import { 
  fetchSoloTravelers, 
  fetchPublicGroups,
} from "@/features/explore/lib/fetchExploreData";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Filter } from "lucide-react";

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
  const [lastFilters, setLastFilters] = useState<Filters | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [datePickerPortalContainer, setDatePickerPortalContainer] =
    useState<HTMLDivElement | null>(null);

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
    [activeTab, router],
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
          (activeTab - 1 + EXPLORE_TABS.length) % EXPLORE_TABS.length,
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
    [activeTab, handleTabChange],
  );

  // Tab buttons with groups layout styling
  const tabButtons = useMemo(
    () =>
      EXPLORE_TABS.map((tab, idx) => (
        <Button
          key={tab.value}
          variant={"outline"}
          className={`flex-auto text-xs sm:text-sm ${
            activeTab === idx
              ? "text-primary bg-primary-light font-semibold rounded-2xl shadow-sm hover:bg-primary-light hover:text-primary border-1 border-primary"
              : "text-foreground font-semibold bg-card rounded-2xl hover:text-primary hover:bg-card"
          }`}
          onClick={() => handleTabChange(idx)}
          onKeyDown={(e) => handleTabKeyDown(e, idx)}
        >
          {tab.label}
        </Button>
      )),
    [activeTab, handleTabChange, handleTabKeyDown],
  );

  const filtersEqual = (a: Filters, b: Filters): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const arrEq = (x: string[], y: string[]) =>
      x.length === y.length &&
      [...x].sort().join(",") === [...y].sort().join(",");
    return (
      a.ageRange[0] === b.ageRange[0] &&
      a.ageRange[1] === b.ageRange[1] &&
      a.gender === b.gender &&
      a.personality === b.personality &&
      a.smoking === b.smoking &&
      a.drinking === b.drinking &&
      a.nationality === b.nationality &&
      a.travelStyle === b.travelStyle &&
      arrEq(a.interests || [], b.interests || []) &&
      arrEq(a.languages || [], b.languages || []) &&
      a.budgetRange[0] === b.budgetRange[0] &&
      a.budgetRange[1] === b.budgetRange[1]
    );
  };

  const hasSearchParamsChanged = (
    newSearchData: SearchData,
    newFilters: Filters,
  ): boolean => {
    if (!lastSearchData) return true;
    const searchDataChanged =
      newSearchData.destination !== lastSearchData.destination ||
      newSearchData.budget !== lastSearchData.budget ||
      newSearchData.startDate.getTime() !==
        lastSearchData.startDate.getTime() ||
      newSearchData.endDate.getTime() !== lastSearchData.endDate.getTime();
    const filtersChanged =
      !lastFilters || !filtersEqual(newFilters, lastFilters);
    return searchDataChanged || filtersChanged;
  };

  const handleSearch = () => {
    setIsSheetOpen(false);
    const fullSearchData: SearchData = {
      ...searchData,
      travelMode: activeTab === 0 ? "solo" : "group",
    };

    if (!hasSearchParamsChanged(fullSearchData, filters)) {
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
        const sessionPayload: any = {
          userId,
          destinationName: fullSearchData.destination,
          budget: fullSearchData.budget,
          startDate: fullSearchData.startDate.toISOString().split("T")[0],
          endDate: fullSearchData.endDate.toISOString().split("T")[0],
          travelMode: fullSearchData.travelMode,
        };

        if (fullSearchData.destinationDetails) {
          sessionPayload.destination = {
            name:
              fullSearchData.destinationDetails.formatted ||
              fullSearchData.destination,
            lat: fullSearchData.destinationDetails.lat,
            lon: fullSearchData.destinationDetails.lon,
            city: fullSearchData.destinationDetails.city,
            country: fullSearchData.destinationDetails.country,
          };
        }

        const sessionResponse = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionPayload),
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
              `${errorMessage}${errorHint ? ` ${errorHint}` : ""}`,
            );
          }

          throw new Error(errorMessage);
        }

        // Add a small delay to ensure Redis session is fully committed
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Step 2: Get solo matches using centralized helper
        const { data: travelers, meta: soloMeta } = await fetchSoloTravelers(
          userId,
          {
            destination: fullSearchData.destination,
            ageMin: filters.ageRange[0],
            ageMax: filters.ageRange[1],
            gender: filters.gender,
            interests: filters.interests,
            languages: filters.languages,
            personality: filters.personality,
            smoking: filters.smoking,
            drinking: filters.drinking,
            nationality: filters.nationality,
            dateStart: fullSearchData.startDate,
            dateEnd: fullSearchData.endDate,
            budgetRange: `${filters.budgetRange[0]}-${filters.budgetRange[1]}`
          } as any
        );

        if (travelers.length > 0 || !soloMeta?.degraded) {
          // Convert lib structure to what ResultsDisplay expects
          const soloMatchesAsGroups = travelers.map((traveler) => ({
            ...traveler, // Preserve everything including flat profile properties
            destination: fullSearchData.destination, // Explicitly override with the searched trip destination
            budget: fullSearchData.budget,
            start_date: fullSearchData.startDate,
            end_date: fullSearchData.endDate,
            compatibility_score: (traveler as any).compatibility_score || 85,
            user: {
              ...((traveler as any).user || {}), // Preserve the deeply hydrated user object
              id: traveler.id,
              userId: traveler.userId,
              name: traveler.name,
              age: traveler.age,
              bio: traveler.bio,
            },
            is_solo_match: true,
          }));

          setMatchedGroups(soloMatchesAsGroups);
          setCurrentGroupIndex(0);
          setLastSearchData(fullSearchData);
          setLastFilters(filters);
        } else if (soloMeta?.degraded) {
          setSearchError("Matching service is currently degraded. Showing limited results.");
        }
      } else {
        // GROUP TRAVEL MODE - Use centralized helper
        const { data: groups, meta: groupMeta } = await fetchPublicGroups(
          userId || "",
          {
            destination: fullSearchData.destination,
            dateStart: fullSearchData.startDate,
            dateEnd: fullSearchData.endDate,
            ageMin: filters.ageRange[0],
            ageMax: filters.ageRange[1],
            gender: filters.gender,
            interests: filters.interests,
            languages: filters.languages,
            smoking: filters.smoking,
            drinking: filters.drinking,
            nationality: filters.nationality,
            budgetRange: `${filters.budgetRange[0]}-${filters.budgetRange[1]}`
          } as any
        );

        const transformedGroups = groups.map((group) => ({
          ...group, // Preserve everything including flat profile properties
          id: group.id,
          name: group.name,
          privacy: group.privacy,
          destination: fullSearchData.destination, // Explicitly override with the searched trip destination
          startDate: group.dateRange?.start || (group as any).startDate,
          endDate: group.dateRange?.end || (group as any).endDate,
          budget: fullSearchData.budget,
          memberCount: group.memberCount,
          userStatus: group.userStatus || "Open",
          creator: group.creator,
          cover_image: group.cover_image,
          score: (group as any).score || 0,
        }));

        setMatchedGroups(transformedGroups);
        setCurrentGroupIndex(0);
        setLastSearchData(fullSearchData);
        setLastFilters(filters);
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
    setLastFilters(null);
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
      setMatchedGroups([]);
      setCurrentGroupIndex(0);
    }
  };

  // Action handlers
  const handleConnect = async (matchId: string) => {
    // TODO: Implement connection logic
    handleNextGroup();
  };

  const handleSuperLike = async (matchId: string) => {
    // TODO: Implement super like logic
  };

  const handlePass = async (matchId: string) => {
    // Move to next match after skipping
    handleNextGroup();
  };

  const handleComment = async (
    matchId: string,
    attribute: string,
    comment: string,
  ) => {
    // TODO: Implement comment submission logic
  };

  const handleViewProfile = (userId: string) => {
    if (!userId) return;
    router.push(`/profile/${userId}`);
  };

  const handleJoinGroup = async (groupId: string) => {
    // TODO: Implement join group logic
    handleNextGroup();
  };

  const handleRequestJoin = async (groupId: string) => {
    // TODO: Implement request join logic
  };

  const handlePassGroup = async (groupId: string) => {
    // TODO: Implement pass logic - move to next group
    handleNextGroup();
  };

  const handleViewGroup = (groupId: string) => {
    if (!groupId) return;
    router.push(`/groups/${groupId}/home`);
  };

  return (
    <div className="min-h-screen px-4 pb-4">
      <div className="max-w-full mx-auto flex flex-col gap-0">
        {/* Tabs Header - Outside containers like groups layout */}
        <header className="flex w-full items-center gap-2 sticky top-0 z-50 bg-background py-4">
          <div className="flex gap-2 flex-auto min-[930px]:w-auto min-[930px]:flex-none">
            {tabButtons}
          </div>

          {/* Mobile Filter Trigger */}
          <div className="flex-auto min-[930px]:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-xs sm:text-sm text-foreground font-semibold bg-card rounded-2xl hover:text-primary"
                >
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[90dvh] bg-card p-0 rounded-t-3xl w-full"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <SheetTitle className="sr-only">Filters</SheetTitle>
                <div
                  ref={(el) => setDatePickerPortalContainer(el ?? null)}
                  className="h-full pt-2 relative"
                >
                  <ExploreSidebar
                    activeTab={activeTab}
                    searchData={searchData}
                    filters={filters}
                    searchLoading={searchLoading}
                    onSearchDataChange={setSearchData}
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    datePickerPortalContainer={datePickerPortalContainer}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-3 h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)] lg:h-[calc(100vh-10rem)]">
          {/* Left Sidebar - Rounded Container */}
          <div className="hidden min-[930px]:flex w-full min-[930px]:w-1/3 flex-shrink-0 rounded-3xl bg-card border-1 border-border overflow-hidden flex-col">
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
          <div className="w-full min-[930px]:w-2/3 bg-card rounded-3xl border-1 border-border overflow-hidden flex flex-col">
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

