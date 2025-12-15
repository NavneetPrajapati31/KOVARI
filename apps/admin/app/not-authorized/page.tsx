'use client';

import { SignOutButton, useClerk } from '@clerk/nextjs';

function SignOutButtonOrPlaceholder() {
  try {
    const clerk = useClerk();
    // If clerk is available, render SignOutButton
    if (clerk) {
      return (
        <SignOutButton redirectUrl="/sign-in">
          <button className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-foreground px-4 text-sm font-medium text-background transition hover:cursor-pointer">
            Sign out
          </button>
        </SignOutButton>
      );
    }
  } catch {
    // ClerkProvider not available (e.g., during build)
  }
  // Fallback placeholder
  return (
    <button
      disabled
      className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-muted px-4 text-sm font-medium text-muted-foreground"
    >
      Sign out
    </button>
  );
}

export default function NotAuthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md space-y-3 rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          Access denied
        </h1>
        <p className="text-sm text-muted-foreground">
          Your account is not on the admin allowlist. Please contact an
          administrator for access.
        </p>
        <div className="flex flex-col items-center gap-2 pt-2">
          <SignOutButtonOrPlaceholder />
        </div>
      </div>
    </main>
  );
}
