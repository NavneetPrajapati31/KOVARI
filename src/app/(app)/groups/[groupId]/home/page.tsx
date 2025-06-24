"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  CardBody,
  Card,
  Image,
  Divider,
  Avatar,
  User,
  CardHeader,
  Chip,
  Tabs,
  Tab,
  Link,
} from "@heroui/react";
import {
  ArrowRight,
  Calendar,
  Camera,
  Car,
  Clock,
  Dot,
  Hotel,
  MapPin,
  Pen,
  Pencil,
  Plane,
  Check,
  X,
} from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import GoogleMapsViewer from "@/shared/components/google-maps-viewer";
import { RangeCalendar } from "@heroui/react";
import { today, getLocalTimeZone, parseDate } from "@internationalized/date";
import { cn } from "@/shared/utils/utils";
import { DestinationCard } from "@/features/groups/components/DestinationCard";
import { GroupCoverCard } from "@/features/groups/components/GroupCoverCard";
import { Skeleton } from "@heroui/react";

const TABS = [
  { label: "Overview", href: "home" },
  { label: "Chats", href: "chat" },
  { label: "Itinerary", href: "itinerary" },
  { label: "Settings", href: "settings" },
];

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

// Types for fetched data
interface GroupInfo {
  id: string;
  name: string;
  destination: string;
  cover_image: string;
  description: string;
  notes: string;
  start_date: string;
  end_date: string;
}

interface GroupMember {
  name: string;
  avatar: string;
  username: string;
  role: string;
}

interface ItineraryItem {
  id: string;
  title: string;
  description: string;
  datetime: string;
  type: string;
  status: string;
  location: string;
  priority: string;
}

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

  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaveLoading, setNoteSaveLoading] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState("Jun 22, 2024");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [groupInfoLoading, setGroupInfoLoading] = useState(true);
  const [groupInfoError, setGroupInfoError] = useState<string | null>(null);

  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [itineraryLoading, setItineraryLoading] = useState(true);
  const [itineraryError, setItineraryError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      setGroupInfoLoading(true);
      setGroupInfoError(null);
      try {
        const res = await fetch(`/api/groups/${params.groupId}`);
        if (!res.ok) throw new Error("Failed to fetch group info");
        const data = await res.json();
        setGroupInfo(data);
      } catch (err: unknown) {
        setGroupInfoError((err as Error).message);
      } finally {
        setGroupInfoLoading(false);
      }
    };
    const fetchGroupMembers = async () => {
      setMembersLoading(true);
      setMembersError(null);
      try {
        const res = await fetch(`/api/groups/${params.groupId}/members`);
        if (!res.ok) throw new Error("Failed to fetch group members");
        const data = await res.json();
        setGroupMembers(data.members || []);
      } catch (err: unknown) {
        setMembersError((err as Error).message);
      } finally {
        setMembersLoading(false);
      }
    };
    const fetchItinerary = async () => {
      setItineraryLoading(true);
      setItineraryError(null);
      try {
        const res = await fetch(`/api/groups/${params.groupId}/itinerary`);
        if (!res.ok) throw new Error("Failed to fetch itinerary");
        const data = await res.json();
        setItineraryItems(data);
      } catch (err: unknown) {
        setItineraryError((err as Error).message);
      } finally {
        setItineraryLoading(false);
      }
    };
    if (params.groupId) {
      fetchGroupInfo();
      fetchGroupMembers();
      fetchItinerary();
    }
  }, [params.groupId]);

  // When groupInfo loads, set noteText from groupInfo.notes
  useEffect(() => {
    if (groupInfo && typeof groupInfo.notes === "string") {
      setNoteText(groupInfo.notes);
    }
  }, [groupInfo]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      const length = noteText.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing, noteText]);

  const handleEdit = () => {
    setIsEditing(true);
    setNoteSaveError(null);
  };

  const handleSave = async () => {
    setNoteSaveLoading(true);
    setNoteSaveError(null);
    try {
      const res = await fetch(`/api/groups/${params.groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save note");
      }
      const updated = await res.json();
      setNoteText(updated.notes || "");
      setIsEditing(false);
    } catch (err: unknown) {
      setNoteSaveError((err as Error).message);
    } finally {
      setNoteSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNoteSaveError(null);
    // Reset to original value from groupInfo
    if (groupInfo && typeof groupInfo.notes === "string") {
      setNoteText(groupInfo.notes);
    }
  };

  // Keydown handler for textarea/input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Helper to extract name and country from destination
  const getNameAndCountry = (
    destination?: string
  ): { name: string; country: string } => {
    if (!destination) return { name: "", country: "" };
    const parts = destination.split(",").map((part) => part.trim());
    return {
      name: parts[0] || "",
      country: parts[1] || "",
    };
  };

  const { name, country } = getNameAndCountry(groupInfo?.destination);

  const handleExplore = () => {
    if (!name) return;
    const query = encodeURIComponent(name);
    const url = `https://maps.apple.com/search?query=${query}`;
    window.open(url, "_blank");
  };

  // Ensure admins appear at the top
  const sortedMembers = [...groupMembers].sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    return 0;
  });

  return (
    <div className="flex h-full bg-background text-foreground border-1 border-border rounded-3xl">
      {/* Left Sidebar - Chat List */}
      <div className="w-1/4 border-r border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="p-3 pb-2">
          {groupInfoLoading ? (
            <Skeleton className="relative w-full h-[200px] rounded-3xl shadow-sm" />
          ) : (
            <GroupCoverCard
              name={groupInfo?.destination || ""}
              country="Japan"
              imageUrl={groupInfo?.cover_image || ""}
              onExplore={() => {}}
            />
          )}
        </div>

        {/* Chat List Area */}
        <div className="flex flex-col gap-2 px-3 mt-0 pb-3">
          {/* Group name */}

          <Card className="bg-card border-1 p-1 pt-4 border-border w-full h-full rounded-3xl shadow-sm">
            <div className="flex flex-col items-start gap-2 mb-2 px-3">
              {groupInfoLoading ? (
                <>
                  <Skeleton className="h-3 w-1/3 mb-2 mt-1 rounded-full" />
                  <Skeleton className="h-3 w-full rounded-full" />
                  <Skeleton className="h-3 w-full rounded-full" />
                </>
              ) : (
                <>
                  <span
                    className="text-md font-bold leading-tight truncate text-foreground"
                    title={groupInfo?.name}
                  >
                    {groupInfo?.name}
                  </span>
                  <p className="text-sm font-medium">
                    {groupInfo?.description}
                  </p>
                </>
              )}
            </div>
            <CardHeader className="flex flex-col p-3 items-start">
              <h2 className="text-sm font-semibold text-gray-800 mb-1">
                {membersLoading ? (
                  <Skeleton className="h-3 w-24 rounded-full mt-1" />
                ) : (
                  `${groupMembers.length} members`
                )}
              </h2>
              {membersLoading ? "" : <Divider />}
            </CardHeader>

            <CardBody className="px-3 pb-4 pt-1">
              <div className="space-y-4">
                {membersLoading
                  ? Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 mt-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <Skeleton className="h-2.5 w-28 mb-1 rounded-full" />
                          <Skeleton className="h-2.5 w-16 rounded-full" />
                        </div>
                      </div>
                    ))
                  : sortedMembers.map((member, index) => (
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
                        {member.role === "admin" ? (
                          <Chip
                            size="sm"
                            variant="bordered"
                            className="text-xs capitalize flex-shrink-0 self-center bg-primary-light border-1 border-primary text-primary px-2"
                          >
                            <span className="font-medium text-xs">Admin</span>
                          </Chip>
                        ) : null}
                      </div>
                    ))}
              </div>
            </CardBody>
          </Card>

          {/* <GoogleMapsViewer /> */}
        </div>
      </div>

      {/* Right Main Area - Chat Conversation */}
      <div className="flex-1 flex flex-col p-3 gap-2">
        <div className="flex flex-row gap-2">
          <div className="flex-shrink-0">
            <DestinationCard
              name={name}
              country={country}
              imageUrl="https://images.unsplash.com/photo-1706708779845-ce24aa579d40?q=80&w=1044&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              onExplore={handleExplore}
            />
          </div>
          <div className="flex-1">
            <Card className="bg-primary-light border-3 p-1 border-card w-full h-[200px] rounded-3xl shadow-sm">
              <CardBody>
                <span className="text-sm mb-1 font-semibold text-primary">
                  AI Overview
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
            <Card className="bg-card border-1 p-2 border-border w-[250px] h-full rounded-3xl shadow-sm">
              <span className="text-sm font-semibold leading-tight truncate text-foreground mt-2 ml-3">
                Mark The Dates!
              </span>

              {groupInfoLoading ||
              !groupInfo?.start_date ||
              !groupInfo?.end_date ? (
                <Skeleton className="h-[250px] w-full px-2 rounded-3xl my-3" />
              ) : (
                <div className="flex items-center justify-center w-full">
                  <div className="w-[250px] flex justify-center mb-0">
                    <div className="scale-90 origin-center">
                      <RangeCalendar
                        isReadOnly
                        aria-label="Date (Read Only)"
                        value={{
                          start: parseDate(groupInfo.start_date),
                          end: parseDate(groupInfo.end_date),
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {groupInfoLoading ? (
                <Skeleton className="h-[130px] w-full p-3 rounded-3xl shadow-sm relative" />
              ) : (
                <div className="bg-[#fff2c0] border-none p-3 rounded-3xl shadow-sm relative">
                  {isEditing ? (
                    <textarea
                      ref={textareaRef}
                      value={noteText.trim() === "" ? "" : noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="block w-full text-xs font-medium text-muted-foreground mb-10 bg-transparent border-none outline-none resize-none min-h-[60px] placeholder:text-muted-foreground focus:ring-0 overflow-hidden"
                      placeholder="Enter your travel note..."
                      autoFocus
                      style={{ lineHeight: "1.625" }}
                    />
                  ) : (
                    <p className="text-xs font-medium text-muted-foreground mb-10 leading-relaxed">
                      {noteText.trim() === "" ? (
                        <span className="text-muted-foreground">
                          Enter your travel note...
                        </span>
                      ) : (
                        noteText
                      )}
                    </p>
                  )}

                  <div className="flex items-center justify-between absolute left-0 right-0 bottom-0 px-4 py-2 mt-2 mb-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={displayDate}
                        onChange={(e) => setDisplayDate(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="text-xs text-muted-foreground font-medium bg-transparent border-none outline-none w-20"
                        placeholder="Date"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium">
                        {displayDate}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Check
                            className="w-4 h-4 cursor-pointer text-green-600 hover:text-green-700 transition-colors outline-none focus:outline-none"
                            onClick={handleSave}
                            tabIndex={0}
                            aria-label="Save changes"
                          />
                          <X
                            className="w-4 h-4 cursor-pointer text-red-600 hover:text-red-700 transition-colors outline-none focus:outline-none"
                            onClick={handleCancel}
                            tabIndex={0}
                            aria-label="Cancel editing"
                          />
                        </>
                      ) : (
                        <Pencil
                          className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground transition-colors outline-none focus:outline-none"
                          onClick={handleEdit}
                          tabIndex={0}
                          aria-label="Edit"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
          <div className="flex-1">
            <Card className="bg-card border-1 py-1 px-4 border-border w-full h-full rounded-3xl shadow-sm">
              <CardBody className="py-2 px-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className=" bg-primary/10 rounded-xl">
                      {/* <Calendar className="w-4 h-4 text-primary" /> */}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Upcoming Itinerary
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {itineraryItems.length} items scheduled
                      </p>
                    </div>
                  </div>
                  <div>
                    <Link href={`/groups/${params.groupId}/itinerary`}>
                      <p className="text-primary text-xs font-medium cursor-pointer">
                        View full itinerary
                      </p>
                    </Link>
                  </div>
                </div>

                {/* Itinerary Items */}
                <div className="space-y-2 mt-1">
                  {itineraryLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-0 group border-1 border-border rounded-3xl p-4"
                        >
                          <div className="flex-1 min-w-0 space-y-2 my-2">
                            <Skeleton className="h-3 w-1/3 rounded-full" />
                            <Skeleton className="h-3 w-full rounded-full" />
                            <Skeleton className="h-3 w-full rounded-full" />
                          </div>
                        </div>
                      ))
                    : itineraryItems.map((item, index) => (
                        <div key={item.id}>
                          <div className="flex items-start gap-2 group hover:bg-background border-1 border-border rounded-3xl p-3  m-0 transition-colors">
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
                                    {formatDate(item.datetime)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{item.datetime.split("T")[1]}</span>
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
