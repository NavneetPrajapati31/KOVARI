"use client";

import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSearch } from "@/components/AdminSearch";

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-between gap-4">
        <AdminSearch />
        <div className="flex items-center">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
