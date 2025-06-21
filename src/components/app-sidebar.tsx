"use client";

import {
  Calendar,
  ChevronUp,
  Home,
  Inbox,
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar } from "@heroui/react";

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="flex h-auto items-center gap-4 py-3 focus:outline-none focus:ring-0">
                    {/* Profile Image */}
                    <Avatar
                      src={user.imageUrl || "/placeholder.svg"}
                      alt={user.fullName || "User avatar"}
                      size="md"
                    />

                    {/* User Info - Right of Avatar */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h2 className="text-md font-bold text-foreground truncate">
                        {user.fullName}
                      </h2>
                      <p className="text-muted-foreground text-xs truncate">
                        @{user.username}
                      </p>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width] shadow-sm"
                >
                  <DropdownMenuItem
                    className="focus:bg-transparent focus:text-primary focus:outline-none border-none"
                    onClick={() => router.push("/profile")}
                  >
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-transparent focus:text-primary focus:outline-none"
                    onClick={() => router.push("/groups")}
                  >
                    <span>My Groups</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-transparent focus:text-primary focus:outline-none"
                    onClick={() => signOut({ redirectUrl: "/" })}
                  >
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
