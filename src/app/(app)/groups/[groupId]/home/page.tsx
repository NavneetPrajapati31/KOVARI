"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardBody, Card, Image, Divider, Avatar } from "@heroui/react";
import { Tabs, Tab } from "@heroui/react";
import { Calendar, MapPin } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { KeyboardEvent, useCallback, useEffect, useState } from "react";
import GoogleMapsViewer from "@/components/google-maps-viewer";
import { RangeCalendar } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "home" },
  { label: "Chats", href: "chat" },
  { label: "Itinerary", href: "itinerary" },
  { label: "Settings", href: "settings" },
];

const GroupHomePage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ groupId: string }>();

  const getTabIndex = useCallback(() => {
    const currentPath = pathname.split("/").pop() || "home";
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
      router.push(`/groups/${params.groupId}/${tab.href}`);
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
    <div className="flex h-full bg-background text-foreground border-1 border-border rounded-lg">
      {/* Left Sidebar - Chat List */}
      <div className="w-1/4 border-r border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="relative h-[190px] rounded-lg overflow-hidden p-3">
          <Image
            src={
              "https://images.pexels.com/photos/31401510/pexels-photo-31401510.jpeg"
            }
            alt={"Group cover"}
            className="h-full w-full object-cover object-top transition-all duration-500 rounded-lg"
            aria-label={"Group cover"}
          />
        </div>

        {/* Chat List Area */}
        <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
          {/* Group name */}
          <div className="flex flex-col items-start gap-2 mb-2">
            <span
              className="text-md font-bold leading-tight truncate text-foreground"
              title="France Group"
            >
              France Group
            </span>
            <p className="text-sm font-medium leading-relaxed">
              Join us in an amazing experience together on our journey to
              France!
            </p>
          </div>

          <span className="text-sm font-bold leading-tight truncate text-foreground mb-2">
            Mark The Dates!
          </span>

          <div className="flex items-center justify-center w-full">
            <RangeCalendar
              isReadOnly
              aria-label="Date (Read Only)"
              value={{
                start: today(getLocalTimeZone()),
                end: today(getLocalTimeZone()).add({ weeks: 1 }),
              }}
            />
          </div>

          {/* <GoogleMapsViewer /> */}
        </div>
      </div>

      {/* Right Main Area - Chat Conversation */}
      <div className="flex-1 flex flex-col p-2"></div>
    </div>
  );
};

export default GroupHomePage;
