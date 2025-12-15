"use client";

import { TabSelector } from "./TabSelector";
import { SearchForm } from "./SearchForm";
import { FiltersPanel } from "./FiltersPanel";
import { SearchData, Filters } from "../types";

interface ExploreSidebarProps {
  activeTab: number;
  searchData: SearchData;
  filters: Filters;
  searchLoading: boolean;
  onTabChange: (index: number) => void;
  onSearchDataChange: (data: SearchData) => void;
  onSearch: () => void;
  onFilterChange: (key: string, value: any) => void;
}

export const ExploreSidebar = ({
  activeTab,
  searchData,
  filters,
  searchLoading,
  onTabChange,
  onSearchDataChange,
  onSearch,
  onFilterChange,
}: ExploreSidebarProps) => {
  return (
    <div className="w-1/4 bg-background border-r border-gray-200 flex flex-col">
      {/* Tab Selector */}
      <TabSelector activeTab={activeTab} onTabChange={onTabChange} />

      {/* Filters with Scrollbar */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Search & Filters
          </h2>
        </div>

        {/* Search Form */}
        <SearchForm
          searchData={searchData}
          onSearchDataChange={onSearchDataChange}
          onSearch={onSearch}
          isLoading={searchLoading}
        />

        {/* Additional Filters */}
        <FiltersPanel filters={filters} onFilterChange={onFilterChange} />
      </div>
    </div>
  );
};
