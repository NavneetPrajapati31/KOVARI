'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/shared/stores/useAuthStore';

import { Skeleton } from '@/shared/components/ui/SkeletonCard';
import DashboardCard from '@/shared/components/ui/DashboardCard';
import GroupPreviewCard from '@/shared/components/ui/GroupPreviewCard';
import TripSummaryCard from '@/shared/components/ui/TripSummaryCard';
import PendingInviteCard from '@/shared/components/ui/PendingInviteCard';
import TripTypePieChart from '@/shared/components/charts/TripTypePieChart';
import TripsBarChart from '@/shared/components/charts/TripsBarChart';

import { useUserGroups } from '@/shared/hooks/useUserGroups';
import { useUserTrips } from '@/shared/hooks/useUserTrips';
import { usePendingInvites } from '@/shared/hooks/usePendingInvites';

import {
  getMostFrequentDestinations,
  getTotalTravelDays,
  getUniqueCoTravelers,
  getTripTypeStats,
  getTripsPerYear,
} from '@/shared/utils/analytics';

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

  const { groups, loading: groupsLoading } = useUserGroups();
  const { trips, loading: tripsLoading } = useUserTrips();
  const { invites, loading: pendingLoading } = usePendingInvites();

  const [travelDays, setTravelDays] = useState<string[]>([]);

  useEffect(() => {
    if (isSignedIn && user) {
      setUser(user);
    }
  }, [isSignedIn, user, setUser]);

  useEffect(() => {
    fetch('/api/travel-days')
      .then((res) => res.json())
      .then((data) => setTravelDays(data.travelDays || []));
  }, []);

  const now = new Date();

  const upcomingTrips = groups.filter(
    (g) => g.group?.start_date && isAfter(new Date(g.group.start_date), now)
  );

  const pastTrips = groups.filter(
    (g) => g.group?.start_date && isBefore(new Date(g.group.start_date), now)
  );

  // Replace with actual logic from groups/trips
  const visitedCountryList = ['India', 'France', 'United States', 'Japan'];

  const mostVisited = getMostFrequentDestinations(groups);
  const totalDays = getTotalTravelDays(groups);
  const coTravelers = getUniqueCoTravelers(groups);
  const tripTypeStats = getTripTypeStats(groups);
  const tripsPerYear = getTripsPerYear(groups);

  return (
    <div className="min-h-screen bg-[#f6f8fa] px-8 py-8">
      {isSignedIn ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[#004831]">Dashboard</h1>
          </div>

          {/* Grid layout for insights */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-2xl shadow p-6">
              <span className="text-gray-500 mb-2">Top Destination</span>
              <p className="text-2xl font-bold">{mostVisited || 'N/A'}</p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <span className="text-gray-500 mb-2">Total Travel Days</span>
              <p className="text-2xl font-bold">{totalDays} days</p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <span className="text-gray-500 mb-2">Co-Travelers (est.)</span>
              <p className="text-2xl font-bold">{coTravelers}</p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <span className="text-gray-500 mb-2">My Groups</span>
              <p className="text-2xl font-bold">{groups.length}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl shadow p-6">
              <span className="text-gray-500 mb-2">Trip Type Distribution</span>
              <TripTypePieChart solo={tripTypeStats.solo} group={tripTypeStats.group} />
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <span className="text-gray-500 mb-2">Trips Per Year</span>
              <TripsBarChart data={tripsPerYear} />
            </div>
          </div>

          {/* Travel Heatmap */}
          <div className="bg-white rounded-2xl shadow p-6 mb-10">
            <span className="text-gray-500 mb-2">Travel Activity Heatmap</span>
            <TravelHeatmap travelDays={travelDays} />
          </div>


          {/* Groups */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[#004831] mb-3">Your Groups</h2>
            {groups.length === 0 ? (
              <p className="text-muted-foreground">You haven't joined any groups yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((g) => (
                  <GroupPreviewCard key={g.group_id} group={g} />
                ))}
              </div>
            )}
          </section>

          {/* Pending Invites */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[#004831] mb-3">Pending Invites</h2>
            {pendingLoading ? (
              <p>Loading...</p>
            ) : invites.length === 0 ? (
              <p className="text-muted-foreground">No pending invites.</p>
            ) : (
              <div className="space-y-4">
                {invites.map((invite) =>
                  invite.group ? (
                    <PendingInviteCard
                      key={invite.id}
                      invite={invite}
                      onAccept={() => console.log('Accept invite:', invite.id)}
                      onDecline={() => console.log('Decline invite:', invite.id)}
                    />
                  ) : null
                )}
              </div>
            )}
          </section>

          {/* Trip Summary */}
          <section>
            <h2 className="text-xl font-semibold text-[#004831] mb-3">Trip Summary</h2>
            {upcomingTrips.length === 0 && pastTrips.length === 0 ? (
              <p className="text-muted-foreground">No trip history found.</p>
            ) : (
              <div className="space-y-6">
                {upcomingTrips.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-[#004831] mb-2">Upcoming Trips</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcomingTrips.map((g) =>
                        g.group ? (
                          <TripSummaryCard
                            key={g.group_id}
                            name={g.group.name}
                            status="upcoming"
                            destination={g.group.destination || 'Unknown'}
                            from={g.group.start_date || 'TBD'}
                            to={g.group.end_date || 'TBD'}
                            tripType={g.group.is_public ? 'Group' : 'Solo'}
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                )}
                {pastTrips.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-[#004831] mb-2">Past Trips</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pastTrips.map((g) =>
                        g.group ? (
                          <TripSummaryCard
                            key={g.group_id}
                            name={g.group.name}
                            status="past"
                            destination={g.group.destination || 'Unknown'}
                            from={g.group.start_date || 'TBD'}
                            to={g.group.end_date || 'TBD'}
                            tripType={g.group.is_public ? 'Group' : 'Solo'}
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      ) : (
        <SkeletonDemo />
      )}
    </div>
  );
}
