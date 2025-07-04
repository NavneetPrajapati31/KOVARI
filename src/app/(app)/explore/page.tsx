"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExploreHeader from "@/features/explore/components/ExploreHeader";
import ExploreResults from "@/features/explore/components/ExploreResults";
import { Loader2 } from "lucide-react";
import { Spinner } from "@heroui/react";

interface FiltersState {
  destination: string;
  dateStart: Date | undefined;
  dateEnd: Date | undefined;
  ageMin: number;
  ageMax: number;
  gender: string;
  interests: string[];
}

const DEFAULT_FILTERS: FiltersState = {
  destination: "",
  dateStart: undefined,
  dateEnd: undefined,
  ageMin: 18,
  ageMax: 99,
  gender: "Any",
  interests: [],
};

// Helpers to serialize/deserialize filters to/from query params
const parseFiltersFromSearchParams = (
  searchParams: URLSearchParams
): FiltersState => {
  return {
    destination: searchParams.get("destination") || "",
    dateStart: searchParams.get("dateStart")
      ? new Date(searchParams.get("dateStart")!)
      : undefined,
    dateEnd: searchParams.get("dateEnd")
      ? new Date(searchParams.get("dateEnd")!)
      : undefined,
    ageMin: searchParams.get("ageMin")
      ? parseInt(searchParams.get("ageMin")!)
      : 18,
    ageMax: searchParams.get("ageMax")
      ? parseInt(searchParams.get("ageMax")!)
      : 99,
    gender: searchParams.get("gender") || "Any",
    interests: searchParams.get("interests")
      ? searchParams.get("interests")!.split(",").filter(Boolean)
      : [],
  };
};

const serializeFiltersToQuery = (
  filters: FiltersState
): Record<string, string> => {
  const query: Record<string, string> = {};
  if (filters.destination) query.destination = filters.destination;
  if (filters.dateStart) query.dateStart = filters.dateStart.toISOString();
  if (filters.dateEnd) query.dateEnd = filters.dateEnd.toISOString();
  if (filters.ageMin !== 18) query.ageMin = String(filters.ageMin);
  if (filters.ageMax !== 99) query.ageMax = String(filters.ageMax);
  if (filters.gender && filters.gender !== "Any") query.gender = filters.gender;
  if (filters.interests.length > 0)
    query.interests = filters.interests.join(",");
  return query;
};

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

  // Memoize parsed filters from searchParams
  const parsedFilters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams]
  );
  const [filters, setFilters] = useState<FiltersState>(parsedFilters);

  // Sync filters state with URL changes (e.g., browser navigation)
  useEffect(() => {
    if (
      filters.destination !== parsedFilters.destination ||
      filters.dateStart?.toISOString() !==
        parsedFilters.dateStart?.toISOString() ||
      filters.dateEnd?.toISOString() !== parsedFilters.dateEnd?.toISOString() ||
      filters.ageMin !== parsedFilters.ageMin ||
      filters.ageMax !== parsedFilters.ageMax ||
      filters.gender !== parsedFilters.gender ||
      filters.interests.join() !== parsedFilters.interests.join()
    ) {
      setFilters(parsedFilters);
    }
  }, [parsedFilters]);

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

  const handleFilterChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
    // Merge with current tab param
    let tabParam = "travelers";
    if (activeTab === 1) tabParam = "groups";
    const query: Record<string, string> = {
      ...serializeFiltersToQuery(newFilters),
      tab: tabParam,
    };
    const queryString = Object.entries(query)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    router.push(`/explore?${queryString}`, { scroll: false });
  };

  const memoizedFilters = useMemo(() => filters, [filters]);
  const memoizedOnFilterChange = useCallback(handleFilterChange, [
    filters,
    activeTab,
    router,
  ]);
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

  return (
    <>
      {isPageLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-card h-screen">
          <Spinner variant="spinner" size="md" color="primary" />
        </div>
      )}
      <div className="flex flex-col w-full min-h-screen relative">
        <ExploreHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          filters={memoizedFilters}
          onFilterChange={memoizedOnFilterChange}
          onDropdownOpenChange={memoizedOnDropdownOpenChange}
        />
        <div
          className={`w-full flex-1 px-4 transition-[filter,opacity] duration-500 ease-in-out ${
            isFilterDropdownOpen
              ? "blur-md opacity-80 pointer-events-none select-none"
              : "blur-0 opacity-100"
          }`}
        >
          <ExploreResults
            activeTab={activeTab}
            filters={filters}
            onShowLoading={() => setIsPageLoading(true)}
          />
        </div>
      </div>
    </>
  );
}
