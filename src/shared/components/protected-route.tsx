"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Spinner } from "@heroui/react";
import { useSyncUserToSupabase } from "@/lib/syncUserToSupabase";

const ONBOARDING_PATH_PREFIX = "/onboarding";

function isOnboardingPath(path: string | null): boolean {
  return (
    path === ONBOARDING_PATH_PREFIX ||
    (path?.startsWith(`${ONBOARDING_PATH_PREFIX}/`) ?? false)
  );
}

/**
 * Protects app routes: ensures user is signed in, synced to Supabase, and has
 * completed onboarding (profile exists). New users without a profile are
 * redirected to /onboarding and can't access the app until they complete it.
 * Profile check runs at most once per session for existing users.
 */
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { syncUser } = useSyncUserToSupabase();
  const debug = process.env.NODE_ENV !== "production";

  const [phase, setPhase] = useState<
    "sync" | "check_profile" | "allow" | "redirect"
  >("sync");
  const syncedRef = useRef(false);
  const profileConfirmedRef = useRef(false);
  const checkDoneThisCycleRef = useRef(false);

  // 1. Redirect unauthenticated users
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      if (debug) console.warn("[ProtectedRoute] Not signed in -> /sign-in");
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // 2. One-time sync user to Supabase
  useEffect(() => {
    if (!isLoaded || !isSignedIn || syncedRef.current) return;
    syncedRef.current = true;
    setPhase("sync");
    if (debug) console.log("[ProtectedRoute] Syncing user to Supabase…");
    syncUser()
      .then((ok) => {
        if (debug) console.log("[ProtectedRoute] Sync result", { ok });
      })
      .catch((err) => console.error("[ProtectedRoute] sync failed", err))
      .finally(() => setPhase("check_profile"));
  }, [isLoaded, isSignedIn, syncUser]);

  // 3. Onboarding gate: allow /onboarding; otherwise require profile (once per session or after onboarding)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || phase === "sync") return;

    const path = pathname ?? "";

    if (isOnboardingPath(path)) {
      if (!profileConfirmedRef.current) checkDoneThisCycleRef.current = false;
      setPhase("allow");
      return;
    }

    if (phase === "redirect") return;

    if (profileConfirmedRef.current) {
      setPhase("allow");
      return;
    }

    if (phase !== "check_profile" && checkDoneThisCycleRef.current) {
      setPhase("allow");
      return;
    }

    checkDoneThisCycleRef.current = true;

    const runProfileCheck = () => {
      fetch("/api/profile/current", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => {
          if (debug) {
            console.log("[ProtectedRoute] /api/profile/current", {
              status: res.status,
              ok: res.ok,
              path,
            });
          }
          if (res.ok) {
            profileConfirmedRef.current = true;
            setPhase("allow");
          } else {
            setPhase("redirect");
            router.replace(ONBOARDING_PATH_PREFIX);
          }
        })
        .catch((err) => {
          if (debug)
            console.error("[ProtectedRoute] profile check failed", err);
          setPhase("redirect");
          router.replace(ONBOARDING_PATH_PREFIX);
        });
    };

    // If already in "allow" (e.g. came from onboarding), check in background
    // without showing spinner; only redirect if profile incomplete.
    if (phase === "allow") {
      runProfileCheck();
      return;
    }

    setPhase("check_profile");
    runProfileCheck();
  }, [isLoaded, isSignedIn, phase, pathname, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  // Onboarding path: always render children immediately. Do not show spinner or
  // run profile check, so we never redirect away from onboarding.
  const path = pathname ?? "";
  if (isOnboardingPath(path)) {
    return <>{children}</>;
  }

  if (phase === "sync" || phase === "check_profile" || phase === "redirect") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-card h-screen">
        <Spinner variant="spinner" size="md" color="primary" />
      </div>
    );
  }

  return <>{children}</>;
}
