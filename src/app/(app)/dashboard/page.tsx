"use client";
import { Search, Bell, Heart } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/shared/stores/useAuthStore";

import { Skeleton } from "@heroui/react";
import DashboardCard from "@/shared/components/ui/DashboardCard";
import DoneTripsCard from "@/shared/components/DoneTripsCard/DoneTripsCard";
import { GroupList } from "@/shared/components/GroupCard/GroupCard-list";
import TodoChecklist from "@/shared/components/Todo-Checklist/Todo-checklist";
import TripsBarChart from "@/shared/components/charts/TripsBarChart";
import dynamic from "next/dynamic";

const TravelHeatmap = dynamic(
  () => import("@/shared/components/heatmap/TravelHeatmap"),
  { ssr: false }
);

const UpcomingTripCard = dynamic(
  () =>
    import("@/features/dashboard/UpcomingTripCard").then((mod) => ({
      default: mod.UpcomingTripCard,
    })),
  { ssr: false }
);

import { useUserGroups } from "@/shared/hooks/useUserGroups";
import { useUserTrips } from "@/shared/hooks/useUserTrips";
import { usePendingInvites } from "@/shared/hooks/usePendingInvites";

import {
  getMostFrequentDestinations,
  getTotalTravelDays,
  getUniqueCoTravelers,
  getTripsPerYear,
} from "@/shared/utils/analytics";

import { isBefore, isAfter } from "date-fns";
import { Card, CardContent } from "@/shared/components/ui/card";
import { GroupCard } from "@/features/dashboard/GroupCard";
import Component from "@/shared/components/comp-531";
import { GalleryCard } from "@/features/dashboard/GalleryCard";
import Heatmap from "@/features/dashboard/heatmap";
import { TopDestinationCard } from "@/features/dashboard/TopDestinationCard";
import { TravelDaysCard } from "@/features/dashboard/TravelDaysCard";
import type { UserProfile as UserProfileType } from "@/features/profile/components/user-profile";
import { InviteCard } from "@/features/dashboard/InviteCard";
import { UserConnect } from "@/features/dashboard/UserConnect";
import { ConnectionRequestsCard } from "@/features/dashboard/ConnectionRequestsCard";

import { ChartLineDots } from "@/features/dashboard/ImpressionsChart";
import ItineraryUI from "@/shared/components/comp-542";
import Link from "next/link";

interface ItineraryEvent {
  id: string;
  time: { hour: number; minute: number; ampm: "AM" | "PM" };
  label?: string;
  description: string;
  duration: string;
  active: boolean;
}

interface ItineraryDay {
  id: number;
  name: string;
  events: ItineraryEvent[];
}

// Dashboard Skeleton Components - Simplified (outer cards only)
function DashboardSkeleton() {
  return (
    <div className="h-full bg-background p-4 flex flex-col gap-3">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-2">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-6">
          <Skeleton className="h-5 w-20" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 h-full">
        {/* Left Column */}
        <div className="flex flex-col w-full lg:w-1/2 gap-3 h-full">
          {/* Top Row: Cards */}
          <div className="flex flex-col md:flex-row gap-3 lg:h-[160px]">
            {/* Upcoming Trip Card Skeleton */}
            <div className="w-full md:w-1/3 h-[180px] md:h-full">
              <Skeleton className="w-full h-full rounded-xl" />
            </div>
            {/* Top Destination Card Skeleton */}
            <div className="w-full md:w-1/3 h-[180px] md:h-full">
              <Skeleton className="w-full h-full rounded-xl" />
            </div>
            {/* Stats Cards Skeleton */}
            <div className="w-full md:w-1/3 flex flex-col gap-3 h-full">
              <Skeleton className="flex-1 w-full rounded-xl" />
              <Skeleton className="flex-1 w-full rounded-xl" />
            </div>
          </div>

          {/* Bottom Row: Groups and Requests */}
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            {/* Travel Groups Skeleton */}
            <div className="w-full md:flex-1 min-w-0">
              <Skeleton className="w-full h-full rounded-xl max-h-[85vh]" />
            </div>

            {/* Connection Requests Skeleton */}
            <div className="w-full md:flex-1 min-w-0">
              <Skeleton className="w-full h-full rounded-xl max-h-[85vh]" />
            </div>
          </div>
        </div>

        {/* Right Column: Itinerary Skeleton */}
        <div className="flex flex-col w-full lg:w-1/2 h-full">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isSignedIn } = useUser();
  const setUser = useAuthStore((s) => s.setUser);

  const { groups, loading: groupsLoading } = useUserGroups();
  const { trips } = useUserTrips();
  const { invites } = usePendingInvites();

  const [travelDays, setTravelDays] = useState<string[]>([]);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [profileImpressions, setProfileImpressions] = useState<number | null>(
    null
  );
  const [impressionsLoading, setImpressionsLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn && user) setUser(user);
  }, [isSignedIn, user]);

  useEffect(() => {
    fetch("/api/travel-days")
      .then((res) => res.json())
      .then((data) => setTravelDays(data.travelDays || []));
  }, []);

  // Fetch profile impressions
  const fetchProfileImpressions = useCallback(async () => {
    if (isSignedIn && user) {
      setImpressionsLoading(true);
      try {
        const res = await fetch("/api/profile-impressions");
        const data = await res.json();
        setProfileImpressions(data.impressions || 0);
      } catch (err) {
        console.error("Error fetching profile impressions:", err);
        setProfileImpressions(0);
      } finally {
        setImpressionsLoading(false);
      }
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    fetchProfileImpressions();
  }, [fetchProfileImpressions]);

  // Refresh impressions when page comes into focus (user navigates back from explore)
  useEffect(() => {
    const handleFocus = () => {
      fetchProfileImpressions();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchProfileImpressions();
      }
    };

    // Also refresh periodically every 30 seconds when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchProfileImpressions();
      }
    }, 30000); // 30 seconds

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchProfileImpressions]);

  const formattedTravelDays = travelDays.filter((d) =>
    /^\d{4}-\d{2}-\d{2}$/.test(d)
  );
  const years = useMemo(
    () =>
      [...new Set(formattedTravelDays.map((d) => +d.split("-")[0]))].sort(
        (a, b) => b - a
      ),
    [formattedTravelDays]
  );
  const [selectedYear, setSelectedYear] = useState(
    () => years[0] || new Date().getFullYear()
  );

  useEffect(() => {
    if (years.length && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years]);

  const now = new Date();

  const past = useMemo(
    () =>
      groups
        .filter(
          (g) =>
            g.group?.start_date && isBefore(new Date(g.group.start_date), now)
        )
        .sort(
          (a, b) =>
            new Date(b.group?.start_date!).getTime() -
            new Date(a.group?.start_date!).getTime()
        ),
    [groups]
  );

  const upcoming = useMemo(
    () =>
      groups
        .filter(
          (g) =>
            g.group?.start_date && isAfter(new Date(g.group.start_date), now)
        )
        .sort(
          (a, b) =>
            new Date(a.group?.start_date!).getTime() -
            new Date(b.group?.start_date!).getTime()
        ),
    [groups]
  );

  const nearestUpcomingGroupId = upcoming[0]?.group?.id;
  const selectedGroupId = nearestUpcomingGroupId || past[0]?.group?.id;

  console.log(
    "User groups:",
    groups.map((g) => g.group?.id)
  );
  console.log("Selected Group ID for itinerary:", selectedGroupId);

  // Fetch itinerary
  useEffect(() => {
    if (!selectedGroupId) {
      setItineraryDays([]);
      return;
    }

    setItineraryLoading(true);
    setItineraryError(null);

    fetch(`/api/Itinerary?groupId=${selectedGroupId}`)
      .then((res) => {
        console.log("API /api/Itinerary status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("API /api/Itinerary data:", data);
        const byDay: { [date: string]: any[] } = {};
        data.forEach((item: any) => {
          const date = item.datetime?.split("T")[0];
          if (!date) return;
          byDay[date] = byDay[date] || [];
          byDay[date].push(item);
        });

        const sortedDays = Object.keys(byDay).sort();
        const mapped = sortedDays.map((date, idx) => ({
          id: idx + 1,
          name: `Day ${idx + 1}`,
          events: byDay[date].map((item: any) => {
            const t = new Date(item.datetime);
            let hour = t.getHours(),
              minute = t.getMinutes();
            const ampm: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
            hour = hour % 12 || 12;
            return {
              id: item.id,
              time: { hour, minute, ampm },
              label: item.title,
              description: item.description,
              duration: item.duration || "",
              active: !item.is_archived,
            };
          }),
        }));
        console.log("Mapped itineraryDays:", mapped);
        setItineraryDays(mapped);
      })
      .catch((err) => {
        console.error("API /api/Itinerary error:", err);
        setItineraryError(err.message || "Unknown error");
      })
      .finally(() => setItineraryLoading(false));
  }, [selectedGroupId]);

  const mostVisited = getMostFrequentDestinations(groups);
  const totalDays = getTotalTravelDays(groups);
  const coTravelers = getUniqueCoTravelers(groups);
  const tripsPerYear = useMemo(() => getTripsPerYear(groups), [groups]);

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

  // Get the most recent or upcoming group for destination card
  const selectedGroup = upcoming[0] || past[0];
  const { name, country } = getNameAndCountry(
    selectedGroup?.group?.destination || undefined
  );

  // Get trip dates from the selected group
  const startDate = selectedGroup?.group?.start_date || undefined;
  const endDate = selectedGroup?.group?.end_date || undefined;

  const handleExplore = () => {
    if (!name) return;
    const query = encodeURIComponent(name);
    const url = `https://maps.apple.com/search?query=${query}`;
    window.open(url, "_blank");
  };

  const isLoading = groupsLoading || !isSignedIn;

  return (
    <div className="h-full bg-background p-4 flex flex-col gap-3">
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="flex items-center justify-between pb-2">
            <div>
              <h1 className="text-sm font-medium">
                Hi, {user?.firstName || "User"}
              </h1>
              <p className="text-muted-foreground text-xs">
                Welcome back to KOVARI 👋🏻
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* <Search className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground" /> */}
              <Link href={"/notifications"}>
                <div className="relative cursor-pointer">
                  <Bell className="w-5 h-5 text-foreground" />
                  <span className="absolute -top-0.5 right-0 w-2.5 h-2.5 bg-primary rounded-full border-[2px] border-background" />
                </div>
              </Link>

              <Link href={"/requests"}>
                <Heart className="w-5 h-5 text-foreground cursor-pointer" />
              </Link>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-3 h-full">
            <div className="flex flex-col w-full lg:w-1/2 gap-3 h-full">
              <div className="flex flex-col md:flex-row gap-3 lg:h-[160px]">
                <div className="w-full md:w-1/3 h-[180px] md:h-full">
                  <div className="h-full">
                    <UpcomingTripCard
                      groupId={selectedGroupId || ""}
                      name={name}
                      country={country}
                      startDate={startDate}
                      endDate={endDate}
                      imageUrl="https://images.pexels.com/photos/8776666/pexels-photo-8776666.jpeg"
                      onExplore={handleExplore}
                      isLoading={groupsLoading}
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/3 h-[180px] md:h-full">
                  <div className="h-full">
                    <TopDestinationCard
                      name={name}
                      country={country}
                      imageUrl="https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg"
                      onExplore={handleExplore}
                      isLoading={groupsLoading}
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/3 flex flex-col gap-3 h-full">
                  <div className="flex-1">
                    <DashboardCard
                      title="Total Travel Days"
                      value={`${totalDays} days`}
                      loading={groupsLoading}
                      subtitle="Total travel days across all groups"
                    />
                  </div>
                  <div className="flex-1">
                    <DashboardCard
                      title="Profile Impressions"
                      value={
                        impressionsLoading
                          ? "Loading..."
                          : profileImpressions !== null
                            ? `${profileImpressions} impression${profileImpressions !== 1 ? "s" : ""}`
                            : "0 impressions"
                      }
                      loading={impressionsLoading || groupsLoading}
                      subtitle="Total profile impressions"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 flex-1">
                <div className="w-full md:flex-1 min-w-0 bg-card border border-border rounded-xl h-full flex flex-col max-h-[85vh]">
                  <div className="mb-3 p-4 border-b border-border flex-shrink-0">
                    <h2 className="text-foreground font-semibold text-xs truncate">
                      Travel Groups
                    </h2>
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      Manage your collaborative travel experiences
                    </p>
                  </div>
                  <div className="px-4 pb-3 flex-1 overflow-hidden">
                    {groupsLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 border-b border-border"
                          >
                            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <GroupList title="My Groups" />
                    )}
                  </div>
                </div>
                <div className="w-full md:flex-1 min-w-0 h-full flex flex-col">
                  <div className="flex-1 min-h-0">
                    <ConnectionRequestsCard />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col w-full lg:w-1/2 h-full">
              <div className="h-full overflow-hidden">
                {itineraryLoading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (
                  <ItineraryUI />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
