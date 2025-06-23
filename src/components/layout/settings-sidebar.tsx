"use client";
import React, { KeyboardEvent, useEffect } from "react";

const LOCAL_STORAGE_KEY = "settingsSidebarActiveTab";

const TABS = [
  { key: "edit", label: "Edit Group" },
  { key: "members", label: "Manage Members" },
  { key: "delete", label: "Delete or Leave Group" },
];

interface SettingsSidebarProps {
  activeTab: string;
  setActiveTab: (key: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  useEffect(() => {
    const savedTab = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTab && savedTab !== activeTab) {
      setActiveTab(savedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    localStorage.setItem(LOCAL_STORAGE_KEY, key);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      setActiveTab(key);
      localStorage.setItem(LOCAL_STORAGE_KEY, key);
    }
  };

  return (
    <nav aria-label="Settings Tabs" className="flex flex-col gap-1 p-4">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`text-left font-normal text-xs sm:text-sm px-5 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-0 ${
            activeTab === tab.key
              ? "bg-gray-200 text-foreground"
              : "hover:bg-gray-100"
          }`}
          aria-current={activeTab === tab.key ? "page" : undefined}
          aria-label={tab.label}
          tabIndex={0}
          onClick={() => handleTabClick(tab.key)}
          onKeyDown={(e) => handleKeyDown(e, tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default SettingsSidebar;
