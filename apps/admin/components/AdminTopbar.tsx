"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSearch } from "@/components/AdminSearch";

export function AdminTopbar() {
  return (
    <header className="sticky pt-6 pb-0 z-40 flex shrink-0 bg-background">
      <div className="flex w-full items-center px-6 md:px-8 gap-2">
        <SidebarTrigger className="md:hidden px-5 h-10 bg-card border border-border rounded-xl text-muted-foreground" />
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-full">
            <AdminSearch />
          </div>
        </div>
      </div>
    </header>
  );
}
