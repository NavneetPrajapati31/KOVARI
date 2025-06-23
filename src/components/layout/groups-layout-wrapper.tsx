"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardBody, Card, Image, Divider, Avatar } from "@heroui/react";
import { Tabs, Tab } from "@heroui/react";
import { Calendar, MapPin } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { KeyboardEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const TABS = [
  { label: "Overview", href: "home" },
  { label: "Chats", href: "chat" },
  { label: "Itinerary", href: "itinerary" },
  { label: "Settings", href: "settings/edit" },
];

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ groupId: string }>();

  const getTabIndex = useCallback(() => {
    const currentPath = pathname.split("/").pop() || "home";
    if (pathname.includes("/settings/")) return 3; // Settings tab index
    const tabIndex = TABS.findIndex((tab) => tab.href === currentPath);
    return tabIndex > -1 ? tabIndex : 0;
  }, [pathname]);

  const [activeTab, setActiveTab] = useState(getTabIndex());

  useEffect(() => {
    setActiveTab(getTabIndex());
  }, [pathname, getTabIndex]);

  const handleTabChange = (index: number) => {
    if (index !== activeTab) {
      const tab = TABS[index];
      router.replace(`/groups/${params.groupId}/${tab.href}`);
    }
  };

  const handleTabClick = (index: number) => {
    handleTabChange(index);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowRight") {
      handleTabChange((activeTab + 1) % TABS.length);
    } else if (event.key === "ArrowLeft") {
      handleTabChange((activeTab - 1 + TABS.length) % TABS.length);
    } else if (event.key === "Enter" || event.key === " ") {
      handleTabChange(index);
    }
  };
  return (
    <div className="flex bg-background text-foreground p-4">
      {/* Sidebar can go here */}
      <div className="flex-1 flex flex-col">
        <header>
          <div className="flex gap-2 flex-shrink-0">
            {TABS.map((tab, idx) => (
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
            ))}
          </div>
        </header>
        <main className="flex-1 py-4">{children}</main>
      </div>
    </div>
  );
}
