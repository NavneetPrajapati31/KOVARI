"use client";
import React, { KeyboardEvent, useCallback, useMemo, useRef } from "react";

const TABS = [
  { key: "edit", label: "Edit Group" },
  { key: "members", label: "Manage Members" },
  { key: "requests", label: "Join Requests" },
  { key: "delete", label: "Leave Group" },
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
  const lastClickTime = useRef<number>(0);

  const handleTabClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, key: string) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent rapid clicks
      const now = Date.now();
      if (now - lastClickTime.current < 300) {
        return;
      }
      lastClickTime.current = now;

      if (activeTab !== key) {
        setActiveTab(key);
      }
    },
    [activeTab, setActiveTab]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, key: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (activeTab !== key) {
          setActiveTab(key);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
        const nextIndex = (currentIndex + 1) % TABS.length;
        const nextTab = TABS[nextIndex].key;
        if (activeTab !== nextTab) {
          setActiveTab(nextTab);
          // Focus the next tab
          setTimeout(() => tabRefs.current[nextIndex]?.focus(), 0);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
        const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        const prevTab = TABS[prevIndex].key;
        if (activeTab !== prevTab) {
          setActiveTab(prevTab);
          // Focus the previous tab
          setTimeout(() => tabRefs.current[prevIndex]?.focus(), 0);
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        const firstTab = TABS[0].key;
        if (activeTab !== firstTab) {
          setActiveTab(firstTab);
          setTimeout(() => tabRefs.current[0]?.focus(), 0);
        }
      } else if (e.key === "End") {
        e.preventDefault();
        const lastTab = TABS[TABS.length - 1].key;
        if (activeTab !== lastTab) {
          setActiveTab(lastTab);
          setTimeout(() => tabRefs.current[TABS.length - 1]?.focus(), 0);
        }
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
          className={`text-left font-medium text-xs sm:text-sm px-3 sm:px-5 py-1.5 rounded-md focus:outline-none focus:ring-0 hover:bg-gray-100 transition-colors ${
            activeTab === tab.key
              ? "text-primary bg-primary-light font-medium"
              : ""
          }`}
          aria-current={activeTab === tab.key ? "page" : undefined}
          aria-label={tab.label}
          tabIndex={0}
          onClick={(e) => handleTabClick(e, tab.key)}
          onKeyDown={(e) => handleKeyDown(e, tab.key)}
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
        >
          {tab.label}
        </button>
      )),
    [activeTab, handleTabClick, handleKeyDown]
  );

  return (
    <nav
      aria-label="Settings Tabs"
      className="flex flex-row md:flex-col gap-1 p-2 md:p-4 border-b md:border-b-0 md:border-r border-gray-200"
    >
      {tabElements}
    </nav>
  );
};

export default SettingsSidebar;
