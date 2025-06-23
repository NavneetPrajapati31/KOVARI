"use client";
import React, { useState, Suspense } from "react";
import SettingsSidebar from "@/components/layout/settings-sidebar";

const EditPage = React.lazy(
  () => import("@/app/(app)/groups/[groupId]/settings/edit/page")
);
const MembersPage = React.lazy(
  () => import("@/app/(app)/groups/[groupId]/settings/members/page")
);
const DangerPage = React.lazy(
  () => import("@/app/(app)/groups/[groupId]/settings/danger/page")
);

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const TAB_COMPONENTS: Record<
  string,
  React.LazyExoticComponent<React.FunctionComponent>
> = {
  edit: EditPage,
  members: MembersPage,
  delete: DangerPage,
};

export default function LayoutWrapper() {
  const [activeTab, setActiveTab] = useState<string>("edit");
  const ActiveComponent = TAB_COMPONENTS[activeTab] || EditPage;

  return (
    <div className="flex h-full bg-background text-foreground border-1 border-border rounded-3xl">
      {/* Left Sidebar - Settings Tabs */}
      <div className="w-1/4 border-r border-border flex flex-col">
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="flex-1 flex flex-col p-3 gap-2">
        <Suspense fallback={null}>
          <ActiveComponent />
        </Suspense>
      </div>
    </div>
  );
}
