"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

const HIDE_LAYOUT_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/onboarding",
  "/forgot-password",
  "/verify-email",
  "/sso-callback",
];

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const hideLayout = HIDE_LAYOUT_ROUTES.includes(pathname);

  return (
    <>
      {!hideLayout && <Navbar />}
      {children}
    </>
  );
}
