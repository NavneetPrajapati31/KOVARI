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
import { Card, CardContent } from "@/shared/components/ui/card";
import { UpcomingTripCard } from "@/features/dashboard/UpcomingTripCard";
import { GroupCard } from "@/features/dashboard/GroupCard";
import Component from "@/shared/components/comp-531";
import { GalleryCard } from "@/features/dashboard/GalleryCard";
import Heatmap from "@/features/dashboard/heatmap";
import { TopDestinationCard } from "@/features/dashboard/TopDestinationCard";
import { TravelDaysCard } from "@/features/dashboard/TravelDaysCard";
import type { UserProfile as UserProfileType } from "@/features/profile/components/user-profile";
import { InviteCard } from "@/features/dashboard/InviteCard";
import { UserConnect } from "@/features/dashboard/UserConnect";

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
    <div className="min-h-screen bg-background p-4 flex flex-col gap-3">
      {!isSignedIn ? (
        <SkeletonDemo />
      ) : (
        <>
          <div className="flex flex-row gap-3 w-full overflow-hidden">
            {/* Profile Information Section */}
            <Card className="rounded-none border-none shadow-none bg-transparent p-0">
              <CardContent className="p-0">
                <div className="flex flex-row items-stretch gap-3">
                  {/* Profile Avatar Overlay - Stretches to match second card height */}
                  <Card className="w-[160px] h-[160px] min-[840px]:h-[160px] min-[840px]:w-[160px] p-0 bg-muted border-none shadow-none xl overflow-hidden flex-shrink-0">
                    <img
                      src={
                        user?.imageUrl ||
                        "https://images.pexels.com/photos/17071640/pexels-photo-17071640.jpeg"
                      }
                      alt="Profile"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </Card>

                  {/* <Card className="flex flex-col rounded-xl bg-transparent border border-border shadow-none p-6 py-5 gap-0 items-start justify-start flex-1 min-w-0">
                    <div className="flex flex-row items-center gap-x-10 w-full">
                      <div className="flex flex-col flex-1 min-w-0 gap-x-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-md font-extrabold text-foreground leading-tight">
                            {user?.fullName || user?.firstName || "User"}
                          </h1>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mb-2">
                          @
                          {(
                            user?.username ||
                            user?.emailAddresses?.[0]?.emailAddress ||
                            ""
                          ).length > 30
                            ? `${(user?.username || user?.emailAddresses?.[0]?.emailAddress || "").substring(0, 30)}...`
                            : user?.username ||
                              user?.emailAddresses?.[0]?.emailAddress ||
                              ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium mt-1">
                      Traveler
                    </div>
                    <div className="text-sm text-muted-foreground font-medium mt-1 line-clamp-3">
                      Exploring the world one trip at a time
                    </div>
                  </Card> */}
                </div>
              </CardContent>
            </Card>
            <div className="flex-shrink-0">
              {groupsLoading ? (
                <>
                  <Skeleton className="w-[260px] h-[180px] rounded-xl" />
                </>
              ) : (
                <UpcomingTripCard
                  name={name}
                  country={country}
                  imageUrl="https://images.pexels.com/photos/8776666/pexels-photo-8776666.jpeg"
                  onExplore={handleExplore}
                />
              )}
            </div>
            <div className="flex-shrink-0">
              <TopDestinationCard
                key={1}
                name={name}
                country={country}
                imageUrl="https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg"
                onExplore={handleExplore}
              />
            </div>
            <div className="flex-shrink-0">
              <InviteCard
                key={1}
                name={"Jenna Smith"}
                country={country}
                imageUrl="https://images.pexels.com/photos/3884492/pexels-photo-3884492.jpeg"
                onExplore={handleExplore}
              />
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-3 grid-rows-1 gap-0">
                {Array.from({ length: 3 }).map((_, index) => (
                  <UserConnect
                    key={index}
                    name={"Jenna Smith"}
                    country={country}
                    imageUrl="https://images.pexels.com/photos/11608681/pexels-photo-11608681.jpeg"
                    onExplore={handleExplore}
                  />
                ))}
              </div>
            </div>
            {/* <div className="shadow-none border-none flex-shrink-0 gap-2 flex flex-col">
              <div className="">
                <DashboardCard
                  title="Total Travel Days"
                  value={`${totalDays} days`}
                  loading={groupsLoading}
                />
              </div>
            </div> */}
            {/* <div className="flex-1 min-w-0">
              <div className="w-full h-full overflow-hidden">
                <Heatmap data={[]} />
              </div>
            </div> */}
          </div>
          <div className="flex flex-row gap-3">
            <div className="flex-shrink-0 bg-card shadow-sm rounded-xl p-4">
              <div className="mb-3">
                <h2 className="text-foreground font-semibold text-sm truncate">
                  Travel Groups
                </h2>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Manage your collaborative travel experiences
                </p>
              </div>
              {groupsLoading ? (
                <div className="grid grid-cols-2 grid-rows-2 gap-3 mt-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="w-[260px] h-[200px] rounded-xl"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 grid-rows-2 gap-3 mt-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <GroupCard
                      key={index}
                      name={name}
                      country={country}
                      imageUrl="https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg"
                      onExplore={handleExplore}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 bg-card shadow-sm rounded-xl p-4">
              <div className="mb-3">
                <h2 className="text-foreground font-semibold text-sm truncate">
                  Past Trips
                </h2>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Manage your past travel experiences
                </p>
              </div>
              {groupsLoading ? (
                <div className="grid grid-cols-2 grid-rows-2 gap-3 mt-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="w-[260px] h-[200px] rounded-xl"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 grid-rows-1 gap-3 mt-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <GalleryCard
                      key={index}
                      name={name}
                      country={country}
                      imageUrl="https://images.pexels.com/photos/2689619/pexels-photo-2689619.jpeg"
                      onExplore={handleExplore}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-row gap-3">
            <div className="h-full">
              <TodoChecklist />
            </div>
            <Component />
          </div>
        </>
      )}
    </div>
  );
}
