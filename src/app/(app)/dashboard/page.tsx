"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/shared/stores/useAuthStore";

import { Skeleton } from "@/shared/components/ui/SkeletonCard";
import DashboardCard from "@/shared/components/ui/DashboardCard";
import DoneTripsCard from "@/shared/components/DoneTripsCard/DoneTripsCard";
import { GroupList } from "@/shared/components/GroupCard/GroupCard-list";
import TodoChecklist from "@/shared/components/Todo-Checklist/Todo-checklist";
import ItineraryUI from "@/shared/components/Itinerary/Itinerary-ui";
import TripsBarChart from "@/shared/components/charts/TripsBarChart";
import dynamic from "next/dynamic";

const TravelHeatmap = dynamic(
  () => import("@/shared/components/heatmap/TravelHeatmap"),
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
import { Card } from "@heroui/react";
import { UpcomingTripCard } from "@/features/dashboard/UpcomingTripCard";

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

  const handleExplore = () => {
    if (!name) return;
    const query = encodeURIComponent(name);
    const url = `https://maps.apple.com/search?query=${query}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {!isSignedIn ? (
        <SkeletonDemo />
      ) : (
        <>
          <div className="flex flex-row gap-3">
            <div className="flex-shrink-0">
              {groupsLoading ? (
                <>
                  <Skeleton className="w-[260px] h-[200px] rounded-3xl" />
                </>
              ) : (
                <UpcomingTripCard
                  name={name}
                  country={country}
                  imageUrl="https://images.unsplash.com/photo-1706708779845-ce24aa579d40?q=80&w=1044&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  onExplore={handleExplore}
                />
              )}
            </div>
            <Card className="bg-card shadow-none border border-border flex-1 rounded-3xl h-[200px]"></Card>
          </div>
        </>
      )}
    </div>
  );
}
