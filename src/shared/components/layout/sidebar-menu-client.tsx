"use client";
import { useSidebarContext } from "./sidebar-context";
import SidebarMenu from "./sidebar-menu";

export default function SidebarMenuClient() {
  const { isSidebarOpen, closeSidebar } = useSidebarContext();
  return <SidebarMenu open={isSidebarOpen} onClose={closeSidebar} />;
}
