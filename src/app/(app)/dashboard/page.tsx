'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/shared/stores/useAuthStore';

import { Skeleton } from '@/shared/components/ui/SkeletonCard';
import DashboardCard from '@/shared/components/ui/DashboardCard';
import DoneTripsCard from '@/shared/components/DoneTripsCard/DoneTripsCard';
import { GroupList } from '@/shared/components/GroupCard/GroupCard-list';
import TodoChecklist from '@/shared/components/Todo-Checklist/Todo-checklist';
import ItineraryUI from '@/shared/components/Itinerary/Itinerary-ui';
import TripsBarChart from '@/shared/components/charts/TripsBarChart';
import dynamic from 'next/dynamic';

const TravelHeatmap = dynamic(() => import('@/shared/components/heatmap/TravelHeatmap'), { ssr: false });

import { useUserGroups } from '@/shared/hooks/useUserGroups';
import { useUserTrips } from '@/shared/hooks/useUserTrips';
import { usePendingInvites } from '@/shared/hooks/usePendingInvites';

import {
  getMostFrequentDestinations,
  getTotalTravelDays,
  getUniqueCoTravelers,
  getTripsPerYear,
} from '@/shared/utils/analytics';

import { isBefore, isAfter } from 'date-fns';

interface ItineraryEvent {
  id: string;
  time: { hour: number; minute: number; ampm: 'AM' | 'PM' };
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
    fetch('/api/travel-days')
      .then((res) => res.json())
      .then((data) => setTravelDays(data.travelDays || []));
  }, []);

  const formattedTravelDays = travelDays.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  const years = useMemo(() => [...new Set(formattedTravelDays.map(d => +d.split('-')[0]))].sort((a, b) => b - a), [formattedTravelDays]);
  const [selectedYear, setSelectedYear] = useState(() => years[0] || new Date().getFullYear());

  useEffect(() => {
    if (years.length && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years]);

  const now = new Date();

  const past = useMemo(() => (
    groups
      .filter(g => g.group?.start_date && isBefore(new Date(g.group.start_date), now))
      .sort((a, b) => new Date(b.group?.start_date!).getTime() - new Date(a.group?.start_date!).getTime())
  ), [groups]);

  const upcoming = useMemo(() => (
    groups
      .filter(g => g.group?.start_date && isAfter(new Date(g.group.start_date), now))
      .sort((a, b) => new Date(a.group?.start_date!).getTime() - new Date(b.group?.start_date!).getTime())
  ), [groups]);

  const nearestUpcomingGroupId = upcoming[0]?.group?.id;
  const selectedGroupId = nearestUpcomingGroupId || past[0]?.group?.id;

  // Fetch itinerary
  useEffect(() => {
    if (!selectedGroupId) {
      setItineraryDays([]);
      return;
    }

    setItineraryLoading(true);
    setItineraryError(null);

    fetch(`/api/Itinerary?groupId=${selectedGroupId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch itinerary');
        return res.json();
      })
      .then(data => {
        const byDay: { [date: string]: any[] } = {};
        data.forEach((item: any) => {
          const date = item.datetime?.split('T')[0];
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
            let hour = t.getHours(), minute = t.getMinutes();
            const ampm: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12;
            return {
              id: item.id,
              time: { hour, minute, ampm },
              label: item.title,
              description: item.description,
              duration: item.duration || '',
              active: !item.is_archived,
            };
          }),
        }));
        setItineraryDays(mapped);
      })
      .catch(err => setItineraryError(err.message || 'Unknown error'))
      .finally(() => setItineraryLoading(false));
  }, [selectedGroupId]);

  const mostVisited = getMostFrequentDestinations(groups);
  const totalDays = getTotalTravelDays(groups);
  const coTravelers = getUniqueCoTravelers(groups);
  const tripsPerYear = useMemo(() => getTripsPerYear(groups), [groups]);

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      {!isSignedIn ? (
        <SkeletonDemo />
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          </div>

          {/* First Row: Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="min-h-[140px]"><DashboardCard title="Top Destination" value={mostVisited || 'N/A'} loading={groupsLoading} /></div>
            <div className="min-h-[140px]"><DashboardCard title="Total Travel Days" value={`${totalDays} days`} loading={groupsLoading} /></div>
            <div className="min-h-[140px]"><DashboardCard title="Co-Travelers (est.)" value={coTravelers} loading={groupsLoading} /></div>
            <div className="min-h-[140px]"><DashboardCard title="My Groups" value={groups.length} loading={groupsLoading} /></div>
          </div>

          {/* Second Row: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-4 min-h-[300px] flex flex-col justify-between">
              <TripsBarChart data={tripsPerYear} />
            </div>
            <div className="bg-white rounded-2xl p-4 min-h-[300px] flex flex-col justify-between">
              {formattedTravelDays.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No travel data available.
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
          </div>

          {/* Third Row: Tools */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-full"><DoneTripsCard /></div>
            <div className="h-full"><GroupList title="My Groups" /></div>
            <div className="h-full">
              {selectedGroupId ? (
                itineraryLoading ? (
                  <div className="flex items-center justify-center h-full">Loading itinerary...</div>
                ) : itineraryError ? (
                  <div className="text-red-500 text-center">{itineraryError}</div>
                ) : (
                  <ItineraryUI itineraryDays={itineraryDays} cardClassName="border-none shadow-md h-full" />
                )
              ) : null}
            </div>
            <div className="h-full"><TodoChecklist /></div>
          </div>
        </>
      )}
    </div>
  );
}
