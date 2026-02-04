"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageSquare, Users, User, Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { cn } from "@/shared/utils/utils";
import { createClient } from "@/lib/supabase";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user?.id) {
        setProfilePhotoUrl(null);
        return;
      }
      try {
        const supabase = createClient();
        const { data: userRow } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", user.id)
          .maybeSingle();
        if (!userRow?.id) {
          setProfilePhotoUrl(null);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_photo")
          .eq("user_id", userRow.id)
          .maybeSingle();
        setProfilePhotoUrl(profile?.profile_photo ?? null);
      } catch {
        setProfilePhotoUrl(null);
      }
    };
    fetchProfilePhoto();
  }, [user?.id]);

  const profileAvatarSrc =
    profilePhotoUrl && profilePhotoUrl.trim() !== ""
      ? profilePhotoUrl
      : user?.imageUrl || undefined;

  // Define exception routes where the bottom nav should be hidden
  const isHidden =
    (pathname.startsWith("/chat/") && pathname !== "/chat") ||
    (pathname.startsWith("/groups/") && pathname.includes("/chat")) ||
    pathname.startsWith("/onboarding");

  if (isHidden) return null;

  const tabs = [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
      isActive: (path: string) => path === "/dashboard" || path === "/",
    },
    {
      label: "Explore",
      href: "/explore",
      icon: Search,
      isActive: (path: string) => path.startsWith("/explore"),
    },
    {
      label: "Chats",
      href: "/chat",
      icon: Send, // Using MessageSquare or Send/PaperPlane style if preferred, usually MessageSquare matches "Chats" title well.
      isActive: (path: string) => path.startsWith("/chat"),
    },
    {
      label: "Groups",
      href: "/groups",
      icon: Users,
      isActive: (path: string) => path.startsWith("/groups"),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: null, // Special case for avatar
      isActive: (path: string) => path.startsWith("/profile"),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around items-center h-16 md:hidden px-2 pb-safe">
      {tabs.map((tab) => {
        const active = tab.isActive(pathname);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1",
              active ? "text-primary" : "text-foreground "
            )}
          >
            {tab.label === "Profile" ? (
              <Avatar
                className={cn(
                  "h-6 w-6",
                  active ? "ring-2 ring-primary ring-offset-2" : "ring-0"
                )}
              >
                <AvatarImage
                  src={profileAvatarSrc}
                  alt={user?.fullName || "Profile"}
                />
                <AvatarFallback>
                  {user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            ) : (
              Icon && (
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active
                      ? tab.label === "Explore"
                        ? "text-primary"
                        : "text-primary fill-current"
                      : "text-foreground"
                  )}
                  strokeWidth={
                    active && tab.label === "Explore" ? 3 : undefined
                  }
                />
              )
            )}
          </Link>
        );
      })}
    </div>
  );
}
