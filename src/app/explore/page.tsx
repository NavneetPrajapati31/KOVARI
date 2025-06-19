"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ExploreResults from "@/components/explore/ExploreResults";

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
  const getTabIndex = () => (searchParams.get("tab") === "groups" ? 1 : 0);

  const [activeTab, setActiveTab] = useState(getTabIndex);

  // Always derive filters from query params
  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams]
  );

  // Sync activeTab with URL changes
  useEffect(() => {
    const tabIndex = getTabIndex();
    if (activeTab !== tabIndex) {
      setActiveTab(tabIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (index: number) => {
    if (index !== activeTab) {
      setActiveTab(index);
      const newTab = index === 1 ? "groups" : "travelers";
      router.push(`/explore?tab=${newTab}`, { scroll: false });
    }
  };

  const handleFilterChange = (newFilters: FiltersState) => {
    // Merge with current tab param
    const query: Record<string, string> = {
      ...serializeFiltersToQuery(newFilters),
      tab: activeTab === 1 ? "groups" : "travelers",
    };
    const queryString = Object.entries(query)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    router.push(`/explore?${queryString}`, { scroll: false });
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <ExploreHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      <div className="w-full flex-1 px-4">
        <ExploreResults activeTab={activeTab} filters={filters} />
      </div>
    </div>
  );
}
