"use client";
import React, { KeyboardEvent, useCallback, useMemo, useRef } from "react";

const TABS = [
  { key: "edit", label: "Edit Group" },
  { key: "members", label: "Manage Members" },
  { key: "delete", label: "Delete or Leave Group" },
] as const;

interface SettingsSidebarProps {
  activeTab: string;
  setActiveTab: (key: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleTabClick = useCallback(
    (key: string) => {
      setActiveTab(key);
    },
    [setActiveTab]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, key: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActiveTab(key);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
        const nextIndex = (currentIndex + 1) % TABS.length;
        setActiveTab(TABS[nextIndex].key);
        // Focus the next tab
        setTimeout(() => tabRefs.current[nextIndex]?.focus(), 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
        const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        setActiveTab(TABS[prevIndex].key);
        // Focus the previous tab
        setTimeout(() => tabRefs.current[prevIndex]?.focus(), 0);
      } else if (e.key === "Home") {
        e.preventDefault();
        setActiveTab(TABS[0].key);
        setTimeout(() => tabRefs.current[0]?.focus(), 0);
      } else if (e.key === "End") {
        e.preventDefault();
        setActiveTab(TABS[TABS.length - 1].key);
        setTimeout(() => tabRefs.current[TABS.length - 1]?.focus(), 0);
      }
    },
    [activeTab, setActiveTab]
  );

  const tabElements = useMemo(
    () =>
      TABS.map((tab, index) => (
        <button
          key={tab.key}
          ref={(el) => {
            tabRefs.current[index] = el;
          }}
          type="button"
          className={`text-left font-normal text-xs sm:text-sm px-5 py-1.5 rounded-md focus:outline-none focus:ring-0 hover:bg-gray-100 ${
            activeTab === tab.key ? "text-primary font-medium" : ""
          }`}
          aria-current={activeTab === tab.key ? "page" : undefined}
          aria-label={tab.label}
          tabIndex={0}
          onClick={() => handleTabClick(tab.key)}
          onKeyDown={(e) => handleKeyDown(e, tab.key)}
        >
          {tab.label}
        </button>
      )),
    [activeTab, handleTabClick, handleKeyDown]
  );

  return (
    <nav aria-label="Settings Tabs" className="flex flex-col gap-1 p-4">
      {tabElements}
    </nav>
  );
};

export default SettingsSidebar;
