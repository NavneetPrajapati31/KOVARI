"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface TabSelectorProps {
  activeTab: number;
  onTabChange: (index: number) => void;
}

export const TabSelector = ({ activeTab, onTabChange }: TabSelectorProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper to get tab index from URL
  const getTabIndex = () => {
    const tab = searchParams.get("tab");
    if (tab === "groups") return 1;
    return 0;
  };

  useEffect(() => {
    const tabIndex = getTabIndex();
    if (activeTab !== tabIndex) {
      onTabChange(tabIndex);
    }
  }, [searchParams, activeTab, onTabChange]);

  const handleTabChange = (index: number) => {
    if (index !== activeTab) {
      onTabChange(index);
      let newTab = "travelers";
      if (index === 1) newTab = "groups";
      router.push(`/explore?tab=${newTab}`, { scroll: false });
    }
  };

  return (
    <div className="p-4 flex-shrink-0">
      <div className="flex rounded-lg p-1">
        <button
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 0
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
          onClick={() => handleTabChange(0)}
        >
          Solo Travel
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 1
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
          onClick={() => handleTabChange(1)}
        >
          Group Travel
        </button>
      </div>
    </div>
  );
};
