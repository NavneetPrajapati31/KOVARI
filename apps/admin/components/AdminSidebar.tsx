"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Flag,
  UsersRound,
  Clock,
  Settings,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface Metrics {
  pendingFlags: number;
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Flags",
    url: "/flags",
    icon: Flag,
    badge: "pendingFlags",
  },
  {
    title: "Groups",
    url: "/groups",
    icon: UsersRound,
  },
  {
    title: "Sessions",
    url: "/sessions",
    icon: Clock,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Audit Logs",
    url: "/audit",
    icon: FileText,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<Metrics>({ pendingFlags: 0 });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/admin/metrics");
        if (response.ok) {
          const data = await response.json();
          setMetrics({ pendingFlags: data.pendingFlags ?? 0 });
        }
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      }
    };

    fetchMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url));
                const badgeCount =
                  item.badge === "pendingFlags"
                    ? metrics.pendingFlags
                    : undefined;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                        {badgeCount !== undefined && badgeCount > 0 && (
                          <SidebarMenuBadge>
                            <Badge
                              variant="destructive"
                              className="h-5 min-w-5 rounded-full px-1.5 text-xs"
                            >
                              {badgeCount}
                            </Badge>
                          </SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
