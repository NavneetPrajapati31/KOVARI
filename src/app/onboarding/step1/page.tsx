"use client";

import { useEffect } from "react";
import { useSyncUserToSupabase } from "@/lib/syncUserToSupabase";
import ProfileSetupForm from "@/components/forms/ProfileSetupForm";

export default function ProfileSetupPage() {
  const { syncUser } = useSyncUserToSupabase();

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  return (
    <div className="h-screen">
      <ProfileSetupForm />
    </div>
  );
}
