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

export function AppSidebar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div
            className="
              flex items-center border-b
              justify-between
              group-data-[state=collapsed]:justify-center
              group-data-[state=collapsed]:border-none
              group-data-[state=collapsed]:p-0
            "
          >
            <h2
              className="
                text-sm font-semibold text-muted-foreground
                max-w-[120px] opacity-100 pr-2
                overflow-hidden
                group-data-[state=collapsed]:max-w-0
                group-data-[state=collapsed]:opacity-0
                group-data-[state=collapsed]:pr-0
              "
            >
              {" "}
              Application
            </h2>
            <SidebarToggle />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="text-muted-foreground" />
                      <span className="group-data-[state=collapsed]:hidden">
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
