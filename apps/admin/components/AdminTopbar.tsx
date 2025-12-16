'use client';

import { UserButton, useClerk } from '@clerk/nextjs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSearch } from '@/components/AdminSearch';

function UserButtonOrPlaceholder() {
  try {
    const clerk = useClerk();
    // If clerk is available, render UserButton
    if (clerk) {
      return <UserButton />;
    }
  } catch {
    // ClerkProvider not available (e.g., during build)
  }
  // Fallback placeholder
  return <div className="h-8 w-8 rounded-full bg-muted" />;
}

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-between gap-4">
        <AdminSearch />
        <div className="flex items-center">
          <UserButtonOrPlaceholder />
        </div>
      </div>
    </header>
  );
}
