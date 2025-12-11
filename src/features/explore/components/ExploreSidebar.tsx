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
  onCloseMobile?: () => void;
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
  onCloseMobile,
}: ExploreSidebarProps) => {
  return (
    <div className="w-full md:w-80 bg-background border-r border-gray-200 flex flex-col min-h-full md:h-auto h-full max-h-screen overflow-y-auto md:overflow-visible">
      <div className="flex items-center justify-between p-4 md:hidden border-b border-gray-200">
        <span className="text-base font-semibold text-gray-900">Filters</span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="text-sm text-gray-600 px-3 py-1 rounded-md border border-gray-200 bg-white"
          aria-label="Close filters"
        >
          Close
        </button>
      </div>

      {/* Tab Selector */}
      <TabSelector activeTab={activeTab} onTabChange={onTabChange} />

      {/* Filters with Scrollbar */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
