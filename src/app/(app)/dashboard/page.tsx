"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { Skeleton } from "@/shared/components/ui/SkeletonCard";
import DashboardCard from "@/shared/components/ui/DashboardCard";
import { useUserGroups } from "@/shared/hooks/useUserGroups";
import { useUserTrips } from "@/shared/hooks/useUserTrips";
import {
  getMostFrequentDestinations,
  getTotalTravelDays,
  getUniqueCoTravelers,
} from "@/shared/utils/analytics";

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
  const { trips, loading: tripsLoading } = useUserTrips();

  useEffect(() => {
    if (isSignedIn && user) {
      setUser(user);
    }
  }, [isSignedIn, user, setUser]);

  const invites = 5;

  // 🔍 Analytics values
  const mostVisited = getMostFrequentDestinations(groups);
  const totalDays = getTotalTravelDays(groups);
  const coTravelers = getUniqueCoTravelers(groups);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {isSignedIn ? (
        <>
          <h1 className="text-2xl font-bold mb-6">
            Welcome, {user.firstName} 👋
          </h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard
              title="My Groups"
              count={groups.length}
              loading={groupsLoading}
              emptyText="No groups yet"
            />
            <DashboardCard
              title="Upcoming Trips"
              count={trips.length}
              loading={tripsLoading}
              emptyText="No upcoming trips"
            />
            <DashboardCard
              title="Invitations"
              count={invites}
              loading={false}
              emptyText="No invites"
            />
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <DashboardCard
              title="Top Destination"
              count={0}
              loading={groupsLoading}
              emptyText={mostVisited}
            />
            <DashboardCard
              title="Total Travel Days"
              count={totalDays}
              loading={groupsLoading}
              emptyText="0"
            />
            <DashboardCard
              title="Co-Travelers (est.)"
              count={coTravelers}
              loading={groupsLoading}
              emptyText="0"
            />
          </div>
        </>
      ) : (
        <SkeletonDemo />
      )}
    </div>
  );
}
