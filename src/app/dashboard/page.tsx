// src/app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/stores/useAuthStore";
import { Skeleton } from "@/components/ui/skeleton";

function SkeletonDemo() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full bg-[#04724d]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px] bg-[#04724d]" />
        <Skeleton className="h-4 w-[200px] bg-[#04724d]" />
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

  return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      {isSignedIn ? (
        <h1 className="text-2xl font-bold">Welcome, {user.firstName} 👋</h1>
      ) : (
        <div>
          <SkeletonDemo />
        </div>
      )}
    </div>
  );
}
