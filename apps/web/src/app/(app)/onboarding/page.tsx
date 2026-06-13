"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSyncUserToSupabase } from "@kovari/api/client";
import ProfileSetupForm from "@/features/onboarding/components/ProfileSetupForm";
import { useAuth } from "@clerk/nextjs";

export default function ProfileSetupPage() {
  const { syncUser } = useSyncUserToSupabase();
  const { signOut } = useAuth();
  const router = useRouter();
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
          const data = await res.json();
          if (data?.data?.onboardingCompleted === true) {
            router.replace("/dashboard");
          }
        }
      } catch (err: any) {
        // If syncUser fails (e.g., 403 Access restricted for non-beta users), 
        // sign them out using Clerk's useAuth hook and redirect.
        try {
          await signOut();
        } catch {}
        window.location.href = "/?error=beta_required";
      }
    };

    void check();
  }, [syncUser, signOut, router]);

  return (
    <div className="h-screen">
      <ProfileSetupForm />
    </div>
  );
}

