"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUser } from "@clerk/nextjs";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setUser = useAuthStore((state) => state.setUser);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      setUser(user ? user : null);
    }
  }, [user, isLoaded, setUser]);

  return <>{children}</>;
};
