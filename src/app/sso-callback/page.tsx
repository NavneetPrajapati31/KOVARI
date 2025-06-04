"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleRedirectCallback({
          afterSignInUrl: "/",
          afterSignUpUrl: "/",
        });
        router.push("/");
      } catch (error) {
        console.error("SSO callback error:", error);
        router.push("/sign-in?error=sso_failed");
      }
    };

    handleCallback();
  }, [handleRedirectCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-600" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
