"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/components/ui/button";
import {
  SettingsSidebar,
  AccountSection,
  SecuritySection,
  DangerZoneSection,
} from "@/shared/components/settings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("email");
  const isMobile = useIsMobile();

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
  }, []);

  const renderContent = () => {
    if (activeTab === "email") return <AccountSection />;
    if (activeTab === "password") return <SecuritySection />;
    if (activeTab === "delete") return <DangerZoneSection />;
    return <AccountSection />;
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-background text-foreground border-none rounded-none">
      {/* Breadcrumb — match profile edit */}
      <div className="px-1 py-2 md:px-4">
        <Link href="/profile">
          <Button className="inline-flex items-center gap-1 text-xs md:text-sm bg-transparent text-foreground transition-colors">
            <ChevronLeft className="md:h-4 md:w-4 h-3 w-3" />
            Back to Profile
          </Button>
        </Link>
      </div>

      {/* Main Content — match profile edit container/sidebar/content */}
      <div className="flex flex-col md:flex-row min-h-[90vh] h-full bg-card text-foreground border-1 border-border rounded-3xl mx-3 mb-6 md:mx-6">
        {!isMobile && (
          <div className="w-full md:w-1/4 lg:w-1/5 md:border-r-1 border-border h-full flex flex-col self-stretch">
            <SettingsSidebar
              activeTab={activeTab}
              setActiveTab={handleTabChange}
            />
          </div>
        )}
        <div className="flex-1 flex flex-col p-4 md:p-3 gap-2">
          {isMobile ? (
            <div className="flex flex-col gap-6">
              <AccountSection />
              <SecuritySection />
              <DangerZoneSection />
            </div>
          ) : (
            <div className="space-y-6">{renderContent()}</div>
          )}
        </div>
      </div>
    </div>
  );
}
