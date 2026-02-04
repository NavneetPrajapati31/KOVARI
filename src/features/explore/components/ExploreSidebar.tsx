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
  /** When set (e.g. mobile sheet), the date picker popover portals here so it stays clickable. */
  datePickerPortalContainer?: HTMLElement | null;
}

export const ExploreSidebar = ({
  activeTab,
  searchData,
  filters,
  searchLoading,
  onSearchDataChange,
  onSearch,
  onFilterChange,
  datePickerPortalContainer,
}: ExploreSidebarProps) => {
  return (
    <div className="min-[930px]:h-[90vh] h-full flex flex-col">
      {/* Filters with Scrollbar */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-[930px]:p-6 p-5">
        <div className="mb-6 border-b border-border pb-4">
          <h2 className="text-md text-foreground font-bold mb-1">
            Search & Filters
          </h2>
          <p className="text-sm text-muted-foreground">
            Find your perfect travel companion
          </p>
        </div>

        {/* Search Form */}
        <div>
          <SearchForm
            searchData={searchData}
            onSearchDataChange={onSearchDataChange}
            onSearch={onSearch}
            isLoading={searchLoading}
            datePickerPortalContainer={datePickerPortalContainer}
          />
        </div>

        {/* Additional Filters */}
        <FiltersPanel filters={filters} onFilterChange={onFilterChange} />
      </div>
    </div>
  );
};
