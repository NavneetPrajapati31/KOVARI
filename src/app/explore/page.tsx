"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ExploreResults from "@/components/explore/ExploreResults";
import ExploreFilters from "@/components/explore/ExploreFilters";

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

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper to get tab index from searchParams
  const getTabIndex = () => (searchParams.get("tab") === "groups" ? 1 : 0);

  const [activeTab, setActiveTab] = useState(getTabIndex);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);

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
    setFilters(newFilters);
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
