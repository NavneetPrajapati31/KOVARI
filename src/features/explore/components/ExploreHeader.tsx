"use client";
import { useState, KeyboardEvent, useCallback, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import ExploreFilters from "./ExploreFilters";
import React from "react";

const TABS = [{ label: "Travelers" }, { label: "Groups" }] as const;

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

  const handleTabClick = useCallback(
    (index: number) => {
      onTabChange(index);
    },
    [onTabChange]
  );

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onTabChange((activeTab + 1) % TABS.length);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onTabChange((activeTab - 1 + TABS.length) % TABS.length);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onTabChange(index);
      } else if (event.key === "Home") {
        event.preventDefault();
        onTabChange(0);
      } else if (event.key === "End") {
        event.preventDefault();
        onTabChange(TABS.length - 1);
      }
    },
    [activeTab, onTabChange]
  );

  const tabButtons = useMemo(
    () =>
      TABS.map((tab, idx) => (
        <Button
          key={tab.label}
          variant={"outline"}
          className={
            activeTab === idx
              ? "text-primary bg-primary-light font-semibold rounded-2xl shadow-sm hover:bg-primary-light hover:text-primary border-1 border-primary"
              : "text-foreground/80 font-semibold bg-transparent rounded-2xl hover:text-primary"
          }
          onClick={() => handleTabClick(idx)}
          onKeyDown={(e) => handleTabKeyDown(e, idx)}
        >
          {tab.label}
        </Button>
      )),
    [activeTab, handleTabClick, handleTabKeyDown]
  );

  return (
    <div className="w-full flex flex-row flex-wrap items-center gap-2 px-4 py-4">
      {/* Tabs */}
      <div className="flex gap-2 flex-shrink-0">{tabButtons}</div>
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
