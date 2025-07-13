'use client';

import { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/shared/stores/useAuthStore';

// UI Components
import { Skeleton } from '@/shared/components/ui/SkeletonCard';
import DashboardCard from '@/shared/components/ui/DashboardCard';
import GroupPreviewCard from '@/shared/components/ui/GroupPreviewCard';
import TripSummaryCard from '@/shared/components/ui/TripSummaryCard';
import PendingInviteCard from '@/shared/components/ui/PendingInviteCard';
import TripTypePieChart from '@/shared/components/charts/TripTypePieChart';
import TripsBarChart from '@/shared/components/charts/TripsBarChart';
import TodoChecklist from '@/shared/components/Todo-Checklist/Todo-checklist';
import DoneTripsCard from '@/shared/components/DoneTripsCard/DoneTripsCard';
import { GroupCard } from '@/shared/components/GroupCard/GroupCard';
import { GroupList } from '@/shared/components/GroupCard/GroupCard-list';

// Hooks
import { useUserGroups } from '@/shared/hooks/useUserGroups';
import { useUserTrips } from '@/shared/hooks/useUserTrips';
import { usePendingInvites } from '@/shared/hooks/usePendingInvites';

// Utils
import {
  getMostFrequentDestinations,
  getTotalTravelDays,
  getUniqueCoTravelers,
  getTripTypeStats,
  getTripsPerYear,
} from '@/shared/utils/analytics';

// Helpers
import { isAfter, isBefore } from 'date-fns';
import dynamic from 'next/dynamic';
const TravelHeatmap = dynamic(() => import('@/shared/components/heatmap/TravelHeatmap'), { ssr: false });

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

  // Load user data on sign in
  useEffect(() => {
    if (isSignedIn && user) {
      setUser(user);
    }
  }, [isSignedIn, user, setUser]);

  // Hooks to fetch user-related data
  const { groups, loading: groupsLoading } = useUserGroups();
  const { trips, loading: tripsLoading } = useUserTrips();
  const { invites, loading: pendingLoading } = usePendingInvites();

  // Travel Days (for Heatmap)
  const [travelDays, setTravelDays] = useState<string[]>([]);
  useEffect(() => {
    fetch('/api/travel-days')
      .then((res) => res.json())
      .then((data) => setTravelDays(data.travelDays || []));
  }, []);

  const formattedTravelDays = travelDays.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

  const years = useMemo(() => {
    const yearSet = new Set(formattedTravelDays.map((d) => Number(d.split('-')[0])));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [formattedTravelDays]);

  const [selectedYear, setSelectedYear] = useState(() => years[0] || new Date().getFullYear());
  useEffect(() => {
    if (years.length && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const now = new Date();

  // Filter trips
  const upcomingTrips = groups.filter((g) => g.group?.start_date && isAfter(new Date(g.group.start_date), now));
  const pastTrips = groups.filter((g) => g.group?.start_date && isBefore(new Date(g.group.start_date), now));

  // Analytics
  const mostVisited = getMostFrequentDestinations(groups);
  const totalDays = getTotalTravelDays(groups);
  const coTravelers = getUniqueCoTravelers(groups);
  const tripTypeStats = getTripTypeStats(groups);
  const tripsPerYear = getTripsPerYear(groups);

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      {isSignedIn ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Summary Cards */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-6">
              <DashboardCard title="Top Destination" value={mostVisited || 'N/A'} loading={groupsLoading} />
              <DashboardCard title="Total Travel Days" value={`${totalDays} days`} loading={groupsLoading} />
              <DashboardCard title="Co-Travelers (est.)" value={coTravelers} loading={groupsLoading} />
              <DashboardCard title="My Groups" value={groups.length} loading={groupsLoading} />
            </div>

            {/* Bar Chart */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <TripsBarChart data={tripsPerYear} />
            </div>

            {/* Travel Activity Heatmap */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-2xl shadow-md p-6 flex flex-col min-h-[260px]">
              {formattedTravelDays.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No travel data available.</p>
                </div>
              ) : (
                <TravelHeatmap
                  travelDays={formattedTravelDays}
                  year={selectedYear}
                  years={years}
                  setSelectedYear={setSelectedYear}
                />
              )}
            </div>

            {/* Done Trips Summary */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col">
              <DoneTripsCard />
            </div>

            {/* User's Groups List */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col">
              <GroupList title="My Groups" />
            </div>

            {/* Todo Checklist */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col">
              <TodoChecklist />
            </div>
          </div>
        </>
      ) : (
        <SkeletonDemo />
      )}
    </div>
  );
}
