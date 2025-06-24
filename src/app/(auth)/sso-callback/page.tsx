"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Spinner from "@/shared/components/Spinner";

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleRedirectCallback({
          afterSignInUrl: "/",
          afterSignUpUrl: "/onboarding",
        });
        // router.push("/");
      } catch (error) {
        console.error("SSO callback error:", error);
        router.push("/sign-in?error=sso_failed");
      }
    };

    handleCallback();
  }, [handleRedirectCallback, router]);

  return <Spinner />;
}
