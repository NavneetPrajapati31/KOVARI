"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/shared/components/layout/Navbarv2";
import { useState } from "react";

const HIDE_LAYOUT_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/onboarding",
  "/forgot-password",
  "/verify-email",
  "/sso-callback",
];

// Pages where blur should NOT be applied even if avatar menu is open
const EXCEPTION_BLUR_ROUTES = [
  "/",
  // Add more routes as needed
];

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const hideLayout = HIDE_LAYOUT_ROUTES.includes(pathname);
  const isBlurException = EXCEPTION_BLUR_ROUTES.includes(pathname);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  return (
    <>
      {/* {!hideLayout && <Navbar onAvatarMenuOpenChange={setIsAvatarMenuOpen} />} */}
      <div
        className={`h-full min-h-0 transition-[filter,opacity] duration-500 ease-in-out ${
          isAvatarMenuOpen && !isBlurException
            ? "blur-md opacity-80 pointer-events-none select-none"
            : "blur-0 opacity-100"
        }`}
      >
        {children}
      </div>
    </>
  );
}
