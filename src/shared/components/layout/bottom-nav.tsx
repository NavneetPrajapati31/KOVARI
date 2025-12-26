"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageSquare, Users, User, Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/utils/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

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
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex justify-around items-center h-16 md:hidden px-2 pb-safe">
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
                 <Avatar className={cn("h-6 w-6", active ? "ring-2 ring-primary ring-offset-2" : "ring-0")}>
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || "Profile"} />
                    <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
            ) : (
                Icon && <Icon className={cn("h-5 w-5", active && "fill-current")} strokeWidth={active ? 2.5 : 2} />
            )}
            </Link>
        );
      })}
    </div>
  );
}
