// src/app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const { user, isSignedIn } = useUser();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (isSignedIn && user) {
      setUser(user);
    }
  }, [isSignedIn, user, setUser]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            We're working on something exciting for you!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Our team is working hard to bring you an amazing dashboard
            experience. Stay tuned for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
