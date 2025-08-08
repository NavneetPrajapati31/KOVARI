"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/shared/stores/useAuthStore";

import { Skeleton } from "@/shared/components/ui/SkeletonCard";
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

function SkeletonDemo() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full bg-primary" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px] bg-primary" />
        <Skeleton className="h-4 w-[200px] bg-primary" />
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

  useEffect(() => {
    if (isSignedIn && user) setUser(user);
  }, [isSignedIn, user]);

  useEffect(() => {
    fetch("/api/travel-days")
      .then((res) => res.json())
      .then((data) => setTravelDays(data.travelDays || []));
  }, []);

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

  return (
    <div className="h-full bg-background p-4 flex flex-col gap-3">
      {!isSignedIn ? (
        <SkeletonDemo />
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-3 h-full">
            <div className="flex flex-col w-full lg:w-1/2 gap-3 h-full">
              <div className="flex flex-col md:flex-row gap-3 lg:h-[160px]">
                <div className="w-full md:w-1/3 h-[180px] md:h-full">
                  {groupsLoading ? (
                    <>
                      <Skeleton className="w-full h-full rounded-xl" />
                    </>
                  ) : (
                    <div className="h-full">
                      <UpcomingTripCard
                        groupId={selectedGroupId || ""}
                        name={name}
                        country={country}
                        startDate={startDate}
                        endDate={endDate}
                        imageUrl="https://images.pexels.com/photos/8776666/pexels-photo-8776666.jpeg"
                        onExplore={handleExplore}
                      />
                    </div>
                  )}
                </div>
                <div className="w-full md:w-1/3 h-[180px] md:h-full">
                  <div className="h-full">
                    <TopDestinationCard
                      name={name}
                      country={country}
                      imageUrl="https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg"
                      onExplore={handleExplore}
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
                      value={`128 impressions`}
                      loading={groupsLoading}
                      subtitle="Total profile impressions"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 flex-1">
                <div className="w-full lg:w-1/2 bg-card border border-border rounded-xl h-full flex flex-col max-h-[85vh]">
                  <div className="mb-3 p-4 border-b border-border flex-shrink-0">
                    <h2 className="text-foreground font-semibold text-xs truncate">
                      Travel Groups
                    </h2>
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      Manage your collaborative travel experiences
                    </p>
                  </div>
                  <div className="px-4 flex-1 overflow-hidden">
                    <GroupList title="My Groups" />
                  </div>
                </div>
                <div className="w-full lg:w-1/2 h-full flex flex-col">
                  <div className="flex-1 min-h-0">
                    <ConnectionRequestsCard />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col w-full lg:w-1/2 h-full">
              <div className="h-full overflow-hidden">
                <ItineraryUI groupId={selectedGroupId} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
