"use client";
import React, { useCallback, memo } from "react";
import SettingsSidebar from "@/components/layout/settings-sidebar";
import { useSettingsTabs } from "@/hooks/use-settings-tabs";

// Preload all components for instant switching
import EditPage from "@/app/(app)/groups/[groupId]/settings/edit/page";
import MembersPage from "@/app/(app)/groups/[groupId]/settings/members/page";
import DangerPage from "@/app/(app)/groups/[groupId]/settings/danger/page";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const TAB_COMPONENTS = {
  edit: EditPage,
  members: MembersPage,
  delete: DangerPage,
} as const;

// Memoized tab content component to prevent unnecessary re-renders
const TabContent = memo(
  ({ activeTab }: { activeTab: keyof typeof TAB_COMPONENTS }) => {
    const ActiveComponent = TAB_COMPONENTS[activeTab];

    return (
      <div className="w-full h-full">
        <ActiveComponent />
      </div>
    );
  }
);

TabContent.displayName = "TabContent";

export default function LayoutWrapper() {
  const { activeTab, setActiveTab } = useSettingsTabs();

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key);
    },
    [setActiveTab]
  );

  return (
    <div className="flex flex-col md:flex-row h-full bg-background text-foreground border-1 border-border rounded-3xl">
      {/* Top Sidebar (Mobile) / Left Sidebar (Desktop) - Settings Tabs */}
      <div className="w-full md:w-1/4 lg:w-1/5 border-b md:border-b-0 md:border-r border-border flex flex-col">
        <SettingsSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col p-3 gap-2 overflow-hidden">
        <TabContent key={activeTab} activeTab={activeTab} />
      </div>
    </div>
  );
}
