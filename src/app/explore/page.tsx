"use client";
import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";

const TABS = [{ label: "Travelers" }, { label: "Groups" }];

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<number>(0); // Default to 'Groups' as in the image

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowRight") {
      setActiveTab((prev) => (prev + 1) % TABS.length);
    } else if (event.key === "ArrowLeft") {
      setActiveTab((prev) => (prev - 1 + TABS.length) % TABS.length);
    } else if (event.key === "Enter" || event.key === " ") {
      setActiveTab(index);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen">
      <nav
        className="flex gap-3 mt-8 mb-8 ml-8"
        role="tablist"
        aria-label="Explore Tabs"
      >
        {TABS.map((tab, idx) => (
          <Button
            asChild
            key={tab.label}
            variant={"outline"}
            className={
              activeTab === idx
                ? "text-primary bg-primary-light font-semibold rounded-2xl shadow-sm hover:bg-primary-light hover:text-primary"
                : "text-foreground/80 font-semibold bg-transparent rounded-2xl hover:text-primary"
            }
          >
            <Button
              id={`explore-tab-${idx}`}
              role="tab"
              aria-selected={activeTab === idx ? "true" : "false"}
              tabIndex={activeTab === idx ? 0 : -1}
              aria-label={tab.label}
              onClick={() => handleTabClick(idx)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
            >
              {tab.label}
            </Button>
          </Button>
        ))}
      </nav>
      <div
        className="w-full max-w-2xl flex-1 flex items-start justify-center"
        role="tabpanel"
        id="explore-tabpanel"
        aria-labelledby={`explore-tab-${activeTab}`}
      >
        {activeTab === 0 && (
          <div className="text-lg text-muted-foreground mt-8">
            Travelers content
          </div>
        )}
        {activeTab === 1 && (
          <div className="text-lg text-muted-foreground mt-8">
            Groups content
          </div>
        )}
      </div>
    </div>
  );
}
