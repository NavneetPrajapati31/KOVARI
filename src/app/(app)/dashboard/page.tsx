"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { Skeleton } from "@/shared/components/ui/SkeletonCard";
import DashboardCard from "@/shared/components/ui/DashboardCard";
import { useUserGroups } from "@/shared/hooks/useUserGroups";
import { useUserTrips } from "@/shared/hooks/useUserTrips";
import { usePendingInvites } from "@/shared/hooks/usePendingInvites";
import GroupPreviewCard from "@/shared/components/ui/GroupPreviewCard";
import TripSummaryCard from "@/shared/components/ui/TripSummaryCard";
import { PendingInviteCard } from "@/shared/components/ui/PendingInviteCard";

import TripTypePieChart from "@/shared/components/charts/TripTypePieChart";
import TripsBarChart from "@/shared/components/charts/TripsBarChart";

import {
  getMostFrequentDestinations,
  getTotalTravelDays,
  getUniqueCoTravelers,
  getTripTypeStats,
  getTripsPerYear,
} from "@/shared/utils/analytics";

import { isAfter, isBefore } from "date-fns";

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
  const { invites, loading: pendingLoading } = usePendingInvites();

  useEffect(() => {
    if (isSignedIn && user) {
      setUser(user);
    }
  }, [isSignedIn, user, setUser]);

  const now = new Date();
  const upcomingTrips = groups.filter(
    (g) => g.group?.start_date && isAfter(new Date(g.group.start_date), now)
  );
  const pastTrips = groups.filter(
    (g) => g.group?.start_date && isBefore(new Date(g.group.start_date), now)
  );

  const mostVisited = getMostFrequentDestinations(groups);
  const totalDays = getTotalTravelDays(groups);
  const coTravelers = getUniqueCoTravelers(groups);
  const tripTypeStats = getTripTypeStats(groups);
  const tripsPerYear = getTripsPerYear(groups);

  const soloCount = tripTypeStats.solo;
  const groupCount = tripTypeStats.group;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6 space-y-10">
      {isSignedIn ? (
        <>
          <h1 className="text-2xl font-bold">Welcome, {user.firstName} 👋</h1>

          {/* Summary Cards */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DashboardCard
                title="My Groups"
                count={groups.length}
                loading={groupsLoading}
                emptyText="No groups yet"
              />
              <DashboardCard
                title="Upcoming Trips"
                count={trips.length}
                loading={false}
                emptyText="No upcoming trips"
              />
              <DashboardCard
                title="Invitations"
                count={invites.length}
                loading={pendingLoading}
                emptyText="No invites"
              />
            </div>
          </section>

          {/* Quick Stats */}
          <section>
            <h2 className="text-xl font-semibold text-[#004831] mb-3">
              Quick Stats
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DashboardCard
                title="Top Destination"
                value={mostVisited}
                loading={groupsLoading}
                emptyText="No destination yet"
              />
              <DashboardCard
                title="Total Travel Days"
                value={`${totalDays} days`}
                loading={groupsLoading}
                emptyText="0"
              />
              <DashboardCard
                title="Co-Travelers (est.)"
                value={coTravelers}
                loading={groupsLoading}
                emptyText="0"
              />
            </div>
          </section>

          {/* Visual Insights */}
          <section>
            <h2 className="text-xl font-semibold text-[#004831] mb-3">
              Visual Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TripTypePieChart solo={soloCount} group={groupCount} />
              <TripsBarChart data={tripsPerYear} />
            </div>
          </section>

          {/* Your Groups */}
          <section>
            <h2 className="text-xl font-semibold text-[#004831] mb-3">
              Your Groups
            </h2>
            {groups.length === 0 ? (
              <p className="text-muted-foreground">
                You haven't joined any groups yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((g) => (
                  <GroupPreviewCard key={g.group_id} group={g} />
                ))}
              </div>
            )}
          </section>

          {/* Pending Invites */}
          <section>
            <h2 className="text-xl font-semibold text-[#004831] mb-3">
              Pending Invites
            </h2>
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
                      group={invite.group}
                      onAccept={() => console.log("Accept invite:", invite.id)}
                      onDecline={() =>
                        console.log("Decline invite:", invite.id)
                      }
                    />
                  ) : null
                )}
              </div>
            )}
          </section>

          {/* Trip Summary */}
          <section>
            <h2 className="text-xl font-semibold text-[#004831] mb-3">
              Trip Summary
            </h2>
            {upcomingTrips.length === 0 && pastTrips.length === 0 ? (
              <p className="text-muted-foreground">No trip history found.</p>
            ) : (
              <div className="space-y-6">
                {upcomingTrips.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-[#004831] mb-2">
                      Upcoming Trips
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcomingTrips.map((g) =>
                        g.group ? (
                          <TripSummaryCard
                            key={g.group_id}
                            name={g.group.name}
                            status="upcoming"
                            destination={g.group.destination || "Unknown"}
                            from={g.group.start_date || "TBD"}
                            to={g.group.end_date || "TBD"}
                            tripType={
                              g.group.members_count === 1 ? "Solo" : "Group"
                            }
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                {pastTrips.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-[#004831] mb-2">
                      Past Trips
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pastTrips.map((g) =>
                        g.group ? (
                          <TripSummaryCard
                            key={g.group_id}
                            name={g.group.name}
                            status="past"
                            destination={g.group.destination || "Unknown"}
                            from={g.group.start_date || "TBD"}
                            to={g.group.end_date || "TBD"}
                            tripType={
                              g.group.members_count === 1 ? "Solo" : "Group"
                            }
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
