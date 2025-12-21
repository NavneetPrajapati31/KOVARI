"use client";

import { SearchForm } from "./SearchForm";
import { FiltersPanel } from "./FiltersPanel";
import { SearchData, Filters } from "../types";

interface ExploreSidebarProps {
  activeTab: number;
  searchData: SearchData;
  filters: Filters;
  searchLoading: boolean;
  onSearchDataChange: (data: SearchData) => void;
  onSearch: () => void;
  onFilterChange: (key: string, value: any) => void;
}

export const ExploreSidebar = ({
  activeTab,
  searchData,
  filters,
  searchLoading,
  onSearchDataChange,
  onSearch,
  onFilterChange,
}: ExploreSidebarProps) => {
  return (
    <div className="h-full flex flex-col">
      {/* Filters with Scrollbar */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-6">
        <div className="mb-6 border-b border-border pb-4">
          <h2 className="text-md text-foreground font-bold mb-1">
            Search & Filters
          </h2>
          <p className="text-sm text-muted-foreground">
            Find your perfect travel companion
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <SearchForm
            searchData={searchData}
            onSearchDataChange={onSearchDataChange}
            onSearch={onSearch}
            isLoading={searchLoading}
          />
        </div>

        {/* Additional Filters */}
        <FiltersPanel filters={filters} onFilterChange={onFilterChange} />
      </div>
    </div>
  );
};
