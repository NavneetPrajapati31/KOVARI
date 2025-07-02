"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/stores/useAuthStore";
import { Skeleton } from "@/components/SkeletonCard";
import DashboardCard from "@/shared/components/ui/DashboardCard"; // Updated path if you moved it

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

  useEffect(() => {
    if (isSignedIn && user) {
      setUser(user);
    }
  }, [isSignedIn, user, setUser]);

  const loading = false; // Replace with real logic later
  const groups = 2;
  const trips = 0;
  const invites = 5;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {isSignedIn ? (
        <>
          <h1 className="text-2xl font-bold mb-6">
            Welcome, {user.firstName} 👋
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard
              title="My Groups"
              count={groups}
              loading={loading}
              emptyText="No groups yet"
            />
            <DashboardCard
              title="Upcoming Trips"
              count={trips}
              loading={loading}
              emptyText="No upcoming trips"
            />
            <DashboardCard
              title="Invitations"
              count={invites}
              loading={loading}
              emptyText="No invites"
            />
          </div>
        </>
      ) : (
        <SkeletonDemo />
      )}
    </div>
  );
}
