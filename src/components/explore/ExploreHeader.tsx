"use client";
import { useState, KeyboardEvent } from "react";
import { Button } from "../ui/button";
import ExploreFilters from "./ExploreFilters";
import React from "react";

const TABS = [{ label: "Travelers" }, { label: "Groups" }];

interface FiltersState {
  destination: string;
  dateStart: Date | undefined;
  dateEnd: Date | undefined;
  ageMin: number;
  ageMax: number;
  gender: string;
  interests: string[];
}

interface ExploreHeaderProps {
  activeTab: number;
  onTabChange: (index: number) => void;
  filters: FiltersState;
  onFilterChange: (filters: FiltersState) => void;
  onDropdownOpenChange?: (isOpen: boolean) => void;
}

const ExploreHeader = (props: ExploreHeaderProps) => {
  const {
    activeTab,
    onTabChange,
    filters,
    onFilterChange,
    onDropdownOpenChange,
  } = props;

  const handleTabClick = (index: number) => {
    onTabChange(index);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowRight") {
      onTabChange((activeTab + 1) % TABS.length);
    } else if (event.key === "ArrowLeft") {
      onTabChange((activeTab - 1 + TABS.length) % TABS.length);
    } else if (event.key === "Enter" || event.key === " ") {
      onTabChange(index);
    }
  };

  return (
    <div className="w-full flex flex-row flex-wrap items-center gap-2 px-4 py-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-shrink-0">
        {TABS.map((tab, idx) => (
          <Button
            key={tab.label}
            variant={"outline"}
            className={
              activeTab === idx
                ? "text-primary bg-primary-light font-semibold rounded-2xl shadow-sm hover:bg-primary-light hover:text-primary"
                : "text-foreground/80 font-semibold bg-transparent rounded-2xl hover:text-primary"
            }
            onClick={() => handleTabClick(idx)}
            onKeyDown={(e) => handleTabKeyDown(e, idx)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-1 items-center flex-1 justify-end min-w-0 overflow-x-auto">
        <ExploreFilters
          filters={filters}
          onFilterChange={onFilterChange}
          mode={activeTab === 1 ? "group" : "traveler"}
          onDropdownOpenChange={onDropdownOpenChange}
        />
      </div>
    </div>
  );
};

export default React.memo(ExploreHeader);
