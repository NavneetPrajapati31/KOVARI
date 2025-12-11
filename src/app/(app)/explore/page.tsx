"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { ExploreSidebar } from "@/features/explore/components/ExploreSidebar";
import { ResultsDisplay } from "@/features/explore/components/ResultsDisplay";
import { SearchData, Filters } from "@/features/explore/types";
import { Menu } from "lucide-react";

export default function ExplorePage() {
  const { user } = useUser();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [matchedGroups, setMatchedGroups] = useState<any[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearchData, setLastSearchData] = useState<SearchData | null>(null);

  // Search form state
  const [searchData, setSearchData] = useState<SearchData>({
    destination: "",
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

  // Sync travelMode with activeTab when it changes
  useEffect(() => {
    setSearchData(prev => ({
      ...prev,
      travelMode: activeTab === 0 ? "solo" : "group"
    }));
  }, [activeTab]);

  // Helper function to check if search data has changed
  const hasSearchDataChanged = (newSearchData: SearchData): boolean => {
    if (!lastSearchData) return true;

    return (
      newSearchData.destination !== lastSearchData.destination ||
      newSearchData.budget !== lastSearchData.budget ||
      newSearchData.startDate.getTime() !== lastSearchData.startDate.getTime() ||
      newSearchData.endDate.getTime() !== lastSearchData.endDate.getTime()
    );
  };

  const handleSearch = () => {
    const fullSearchData: SearchData = {
      ...searchData,
      travelMode: activeTab === 0 ? "solo" : "group"
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
          throw new Error("Failed to create session");
        }

        // Add a small delay to ensure Redis session is fully committed
        await new Promise(resolve => setTimeout(resolve, 100));

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
            start_date: fullSearchData.startDate,
            end_date: fullSearchData.endDate,
            compatibility_score: Math.round(match.score * 100),
            budget_difference: match.budgetDifference,
            user: {
              ...match.user,
              interests: Array.isArray(match.commonInterests) && match.commonInterests.length > 0
                ? match.commonInterests
                : match.user?.interests
            },
            is_solo_match: true
          }));
          
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
          nationality: filters.nationality !== "Any" ? filters.nationality : "Unknown",
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
          cover_image: undefined,
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
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

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
    console.log("Passing on solo traveler:", matchId);
    // TODO: Implement pass logic - move to next match
    handleNextGroup();
  };

  const handleComment = async (matchId: string, attribute: string, comment: string) => {
    console.log("Commenting on", attribute, "for traveler:", matchId, "Comment:", comment);
    // TODO: Implement comment logic
  };

  const handleViewProfile = (userId: string) => {
    console.log("Viewing profile:", userId);
    // TODO: Navigate to user profile
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
    <div className="flex min-h-screen bg-background md:flex-row flex-col">
      {/* Sidebar (mobile drawer + desktop static) */}
      <div
        className={`fixed inset-0 z-40 md:static md:z-auto transition-transform duration-200 md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-full md:h-auto w-11/12 max-w-md md:w-80 bg-background border-r border-gray-200 shadow-lg md:shadow-none">
          <ExploreSidebar
            activeTab={activeTab}
            searchData={searchData}
            filters={filters}
            searchLoading={searchLoading}
            onTabChange={(tab) => {
              setActiveTab(tab);
              closeSidebar();
            }}
            onSearchDataChange={setSearchData}
            onSearch={() => {
              handleSearch();
              closeSidebar();
            }}
            onFilterChange={handleFilterChange}
            onCloseMobile={closeSidebar}
          />
        </div>
        {/* Backdrop */}
        <button
          type="button"
          onClick={closeSidebar}
          className={`md:hidden absolute inset-0 bg-black/40 transition-opacity ${
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-label="Close filters"
        />
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between md:hidden">
          <div>
            <p className="text-sm text-gray-500">Explore</p>
            <p className="text-lg font-semibold text-gray-900">Find your next trip</p>
          </div>
          <button
            type="button"
            onClick={openSidebar}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-900 shadow-sm"
            aria-label="Open filters"
          >
            <Menu className="w-4 h-4" />
            Filters
          </button>
        </div>

        <ResultsDisplay
          activeTab={activeTab}
          matchedGroups={matchedGroups}
          currentGroupIndex={currentGroupIndex}
          searchLoading={searchLoading}
          searchError={searchError}
          lastSearchData={lastSearchData}
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
  );
}
