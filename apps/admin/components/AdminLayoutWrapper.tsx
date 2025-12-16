"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopbar } from "@/components/AdminTopbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show admin layout on auth pages
  const isAuthPage =
    pathname?.startsWith("/sign-in") || pathname?.startsWith("/not-authorized");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AdminSidebar />
      <SidebarInset className="flex flex-col">
        <AdminTopbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
