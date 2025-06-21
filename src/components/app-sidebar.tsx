"use client";

import {
  Calendar,
  ChevronUp,
  Home,
  Inbox,
  PanelLeftIcon,
  Search,
  Settings,
  User2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar } from "@heroui/react";
import { Button } from "./ui/button";
import type { UserResource } from "@clerk/types";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Groups",
    url: "/groups",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Explore",
    url: "/explore",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export const AcmeLogo = () => {
  return (
    <svg fill="none" height="30" viewBox="0 0 32 32" width="30">
      <path
        clipRule="evenodd"
        d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

function SidebarToggle() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="bg-transparent text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
      onClick={toggleSidebar}
    >
      <PanelLeftIcon className="h-5 w-5 transition-transform duration-300 ease-in-out" />
    </Button>
  );
}

// Extracted SidebarUserMenu for DRYness
interface SidebarUserMenuProps {
  user: UserResource | null | undefined;
  onProfileClick?: () => void;
  onSignOutClick?: () => void;
}

const SidebarUserMenu = ({
  user,
  onProfileClick,
  onSignOutClick,
}: SidebarUserMenuProps) => {
  const { state } = useSidebar();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-none outline-none flex h-auto items-center gap-2 py-3 w-full focus:outline-none focus:ring-0 justify-start"
          aria-label="User menu"
          tabIndex={0}
        >
          <Avatar
            src={user?.imageUrl || "/placeholder.svg"}
            alt={user?.fullName || "User avatar"}
            size="sm"
            className="flex-shrink-0"
          />
          <div
            className={`
              transition-all duration-300 origin-left overflow-hidden
              ${
                state === "collapsed"
                  ? "max-w-0 opacity-0 scale-x-0"
                  : "max-w-[160px] opacity-100 scale-x-100"
              }
            `}
            style={{ minWidth: 0 }}
          >
            <p className="text-sm font-bold text-foreground truncate">
              {user?.fullName}
            </p>
            <p className="text-muted-foreground text-xs truncate text-start">
              @{user?.username}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        className="w-[--radix-popper-anchor-width] shadow-sm"
      >
        <DropdownMenuItem
          className="focus:bg-transparent focus:text-primary focus:outline-none border-none"
          onClick={onProfileClick}
        >
          <span>My Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="focus:bg-transparent focus:text-primary focus:outline-none"
          onClick={onSignOutClick}
        >
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function AppSidebar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <div
            className="
              flex items-center border-b border-border mb-2 mt-1
              justify-between
              group-data-[state=collapsed]:justify-center
              group-data-[state=collapsed]:border-none
              group-data-[state=collapsed]:p-0
            "
          >
            <div
              className="relative flex items-center justify-start"
              style={{ width: 140 }}
            >
              {/* <AcmeLogo /> */}
              <span
                className={`font-semibold text-muted-foreground
                  transition-all duration-300 origin-left overflow-hidden
                  
                  ${
                    state === "collapsed"
                      ? "max-w-0 opacity-0 scale-x-0"
                      : "max-w-[100px] opacity-100 scale-x-100 pl-2"
                  }
                `}
                style={{ minWidth: 0 }}
              >
                KOVARI
              </span>
            </div>
            <SidebarToggle />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="text-muted-foreground" />
                      <span
                        className={`
                          transition-all duration-300 origin-left overflow-hidden
                          font-semibold text-muted-foreground
                          ${
                            state === "collapsed"
                              ? "max-w-0 opacity-0 scale-x-0"
                              : "max-w-[120px] opacity-100 scale-x-100"
                          }
                        `}
                        style={{ minWidth: 0 }}
                      >
                        {item.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* Always show the user menu at the bottom, only details collapse/expand */}
      {user && (
        <SidebarFooter className="flex justify-center">
          <SidebarUserMenu
            user={user}
            onProfileClick={() => router.push("/profile")}
            onSignOutClick={() => signOut({ redirectUrl: "/" })}
          />
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
