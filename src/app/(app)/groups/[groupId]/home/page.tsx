"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CardBody,
  Card,
  Image,
  Divider,
  Avatar,
  User,
  CardHeader,
  Chip,
} from "@heroui/react";
import { Tabs, Tab, Link } from "@heroui/react";
import {
  ArrowRight,
  Calendar,
  Camera,
  Car,
  Clock,
  Dot,
  Hotel,
  MapPin,
  Plane,
  X,
} from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { KeyboardEvent, useCallback, useEffect, useState } from "react";
import GoogleMapsViewer from "@/components/google-maps-viewer";
import { RangeCalendar } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { cn } from "@/lib/utils";
import { DestinationCard } from "@/components/cards/DestinationCard";
import { GroupCoverCard } from "@/components/cards/GroupCoverCard";

const TABS = [
  { label: "Overview", href: "home" },
  { label: "Chats", href: "chat" },
  { label: "Itinerary", href: "itinerary" },
  { label: "Settings", href: "settings" },
];

const upcoming = [
  {
    id: 1,
    title: "Flight to Tokyo",
    description: "JAL 123 - Terminal 1",
    date: "2024-01-15",
    time: "08:30",
    type: "flight",
    status: "confirmed",
    location: "LAX Airport",
    priority: "high",
  },
  {
    id: 2,
    title: "Hotel Check-in",
    description: "Grand Hyatt Tokyo",
    date: "2024-01-15",
    time: "15:00",
    type: "accommodation",
    status: "confirmed",
    location: "Roppongi, Tokyo",
    priority: "medium",
  },
  {
    id: 3,
    title: "Tokyo Tower Visit",
    description: "Sightseeing & Photography",
    date: "2024-01-16",
    time: "10:00",
    type: "activity",
    status: "pending",
    location: "Minato City, Tokyo",
    priority: "low",
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "flight":
      return <Plane className="w-4 h-4" />;
    case "accommodation":
      return <Hotel className="w-4 h-4" />;
    case "transport":
      return <Car className="w-4 h-4" />;
    case "activity":
      return <Camera className="w-4 h-4" />;
    default:
      return <Calendar className="w-4 h-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "flight":
      return "primary";
    case "accommodation":
      return "secondary";
    case "transport":
      return "success";
    case "activity":
      return "warning";
    default:
      return "default";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending":
      return "warning";
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  }
};

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

  const members = [
    {
      name: "Tanisha Combs",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      role: "admin",
      username: "tanishacombs",
    },
    {
      name: "Alex Hunt",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      username: "alexhunt",
    },
    {
      name: "Jasmin Lowery",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      username: "jasminlowery",
    },
    {
      name: "Max Padilla",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      username: "maxpadilla",
    },
    {
      name: "Jessie Rollins",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      username: "jessierollins",
    },
    {
      name: "Lukas Mcgowan",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      username: "lukasmcgowan",
    },
  ];

  return (
    <div className="flex h-full bg-background text-foreground border-1 border-border rounded-3xl">
      {/* Left Sidebar - Chat List */}
      <div className="w-1/4 border-r border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="p-3">
          <GroupCoverCard
            name="Mount Fuji"
            country="Japan"
            imageUrl="https://plus.unsplash.com/premium_photo-1661882926003-91a51e3dfe64?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            onExplore={() => {}}
          />
        </div>

        {/* Chat List Area */}
        <div className="flex flex-col gap-2 px-4 pt-3 pb-3">
          {/* Group name */}
          <div className="flex flex-col items-start gap-2 mb-2">
            <span
              className="text-md font-bold leading-tight truncate text-foreground"
              title="France Group"
            >
              Exploring Mount Fuji
            </span>
            <p className="text-sm font-medium leading-relaxed">
              Join us in an amazing experience together on our journey to Japan!
            </p>
          </div>

          <span className="text-sm font-bold leading-tight truncate text-foreground mb-3 ml-1">
            Mark The Dates!
          </span>

          <div className="flex items-center justify-center w-full">
            <div className="w-[220px] flex justify-center">
              <div className="scale-100 origin-center">
                <RangeCalendar
                  isReadOnly
                  aria-label="Date (Read Only)"
                  value={{
                    start: today(getLocalTimeZone()),
                    end: today(getLocalTimeZone()).add({ weeks: 1 }),
                  }}
                />
              </div>
            </div>
          </div>

          {/* <GoogleMapsViewer /> */}
        </div>
      </div>

      {/* Right Main Area - Chat Conversation */}
      <div className="flex-1 flex flex-col p-3 gap-2">
        <div className="flex flex-row gap-2">
          <div className="flex-shrink-0">
            <DestinationCard
              name="Mount Fuji"
              country="Japan"
              imageUrl="https://images.unsplash.com/photo-1706708779845-ce24aa579d40?q=80&w=1044&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              onExplore={() => router.push("/explore")}
            />
          </div>
          <div className="flex-1">
            <Card className="bg-primary-light border-3 p-1 border-card w-full h-[200px] rounded-3xl shadow-sm">
              <CardBody>
                <span className="text-sm mb-1 font-semibold text-primary">
                  AI description
                </span>
                <p className="text-sm font-medium">
                  Mount Fuji is a dreamlike destination for travelers seeking
                  both adventure and serenity. Towering gracefully over Honshu
                  Island, it invites climbers to ascend its slopes during the
                  official climbing season in July and August, offering
                  panoramic sunrise views that are truly unforgettable. For
                  those who prefer to admire its beauty from afar, nearby spots
                  like Lake Kawaguchi, Hakone, and the famous Chureito Pagoda
                  provide postcard-perfect photo ops.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
        {/* <div className="flex w-full">
          <div className="w-[220px] flex ">
            <div className="scale-80 origin-left">
              <RangeCalendar
                isReadOnly
                aria-label="Date (Read Only)"
                value={{
                  start: today(getLocalTimeZone()),
                  end: today(getLocalTimeZone()).add({ weeks: 1 }),
                }}
              />
            </div>
          </div>
        </div> */}

        <div className="flex flex-row gap-2 flex-1">
          <div className="flex-shrink-0">
            <Card className="bg-card border-1 p-1 border-border w-[230px] h-full rounded-3xl shadow-sm">
              <CardHeader className="flex flex-col p-3 items-start">
                <h2 className="text-sm font-semibold text-gray-800 mb-1">
                  {members.length} members
                </h2>
                <Divider />
              </CardHeader>

              <CardBody className="px-3 pb-4 pt-1">
                <div className="space-y-4">
                  {members.map((member, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <User
                        avatarProps={{
                          src: member.avatar,
                          size: "sm",
                          className: "flex-shrink-0",
                        }}
                        name={
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 text-sm">
                              {member.name}
                            </span>
                          </div>
                        }
                        description={
                          <Link
                            isExternal
                            href={`https://x.com/${member.username}`}
                            size="sm"
                            className="text-gray-600 text-xs hover:text-gray-800"
                          >
                            @{member.username}
                          </Link>
                        }
                        classNames={{
                          wrapper: "flex-1 min-w-0",
                          name: "text-left",
                          description: "text-left",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
          <div className="flex-1">
            <Card className="bg-card border-1 py-1 px-4 border-border w-full h-full rounded-3xl shadow-sm">
              <CardBody className="py-2 px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className=" bg-primary/10 rounded-xl">
                      {/* <Calendar className="w-4 h-4 text-primary" /> */}
                    </div>
                    <div>
                      <h3 className="text-md font-semibold text-foreground">
                        Upcoming Itinerary
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {upcoming.length} items scheduled
                      </p>
                    </div>
                  </div>
                </div>

                {/* Itinerary Items */}
                <div className="space-y-5 mt-1">
                  {upcoming.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-start gap-2 group hover:bg-secondary border-1 border-border rounded-3xl p-3 -m-3 transition-colors">
                        {/* Icon & Type */}
                        <div className="h-4 flex items-center flex-shrink-0">
                          <Dot />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-foreground text-sm leading-tight">
                              {item.title}
                            </h4>
                            <Chip
                              size="sm"
                              color={getStatusColor(item.status)}
                              variant="flat"
                              className={`text-xs capitalize flex-shrink-0 ${
                                item.status === "confirmed"
                                  ? "text-green-600 bg-green-100"
                                  : item.status == "cancelled"
                                  ? "text-destructive bg-[#dc2626]/15"
                                  : ""
                              }`}
                            >
                              <span className="font-medium p-2">
                                {item.status}
                              </span>
                            </Chip>
                          </div>

                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                            {item.description}
                          </p>

                          {/* Date, Time, Location */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="font-medium">
                                {formatDate(item.date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{item.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-24">
                                {item.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupHomePage;
