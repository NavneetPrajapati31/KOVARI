"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSyncUserToSupabase } from "@/lib/syncUserToSupabase";
import ProfileSetupForm from "@/features/onboarding/components/ProfileSetupForm";

export default function ProfileSetupPage() {
  const { syncUser } = useSyncUserToSupabase();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await syncUser();

        const res = await fetch("/api/profile/current", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          // Profile exists, onboarding not needed
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Onboarding profile check failed:", error);
      } finally {
        setCheckingProfile(false);
      }
    };

    void init();
  }, [router, syncUser]);

  if (checkingProfile) {
    return <div className="h-screen bg-background" />;
  }

  return (
    <div className="h-screen">
      <ProfileSetupForm />
    </div>
  );
}
