"use client";
import { useState, KeyboardEvent } from "react";
import { Button } from "../ui/button";

const TABS = [{ label: "Travelers" }, { label: "Groups" }];

interface ExploreHeaderProps {
  activeTab: number;
  onTabChange: (index: number) => void;
}

export default function ExploreHeader({
  activeTab,
  onTabChange,
}: ExploreHeaderProps) {
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
    <div className="w-full flex flex-col">
      <div className="flex gap-3 mt-8 mb-6 ml-8">
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
    </div>
  );
}
