"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSyncUserToSupabase } from "@/lib/syncUserToSupabase";
import ProfileSetupForm from "@/features/onboarding/components/ProfileSetupForm";
import { Button } from "@/shared/components/ui/button";

export default function ProfileSetupPage() {
  const { syncUser } = useSyncUserToSupabase();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "needs_onboarding" | "already_complete"
  >("loading");
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const check = async () => {
      try {
        await syncUser();
        const res = await fetch("/api/profile/current", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          setStatus("already_complete");
        } else {
          setStatus("needs_onboarding");
        }
      } catch {
        setStatus("needs_onboarding");
      }
    };

    void check();
  }, [syncUser]);

  if (status === "loading") {
    return <div className="h-screen bg-background" />;
  }

  if (status === "already_complete") {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center p-6">
        <p className="text-sm text-muted-foreground mb-4 text-center">
          You&apos;ve already completed onboarding.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <ProfileSetupForm />
    </div>
  );
}
