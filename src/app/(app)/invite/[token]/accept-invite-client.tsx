"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Loader2, Users, Home, AlertCircle } from "lucide-react";

export function AcceptInviteClient({
  token,
  groupId,
}: {
  token: string;
  groupId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function acceptInvite() {
      try {
        const res = await fetch("/api/group-invitation/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        });

        if (cancelled) return;

        if (res.ok) {
          router.replace(`/groups/${groupId}/home`);
          return;
        }

        let message = "Something went wrong. Please try again.";
        try {
          const text = await res.text();
          if (text?.length > 0) {
            const data = JSON.parse(text);
            message = typeof data?.error === "string" ? data.error : text;
          }
        } catch {
          // non-JSON or empty body: keep default message
        }
        setError(message);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error
            ? e.message
            : "Something went wrong. Please try again."
        );
      }
    }

    acceptInvite();
    return () => {
      cancelled = true;
    };
  }, [token, groupId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="border border-border rounded-2xl bg-card shadow-sm p-8 sm:p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
              <AlertCircle className="w-7 h-7 text-destructive" aria-hidden />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Couldn’t accept invite
            </h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {error}
            </p>
            <Button
              asChild
              variant="default"
              className="w-full sm:w-auto rounded-full"
            >
              <Link href="/" className="inline-flex items-center gap-2">
                <Home className="w-4 h-4" />
                Go home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="border border-border rounded-2xl bg-card shadow-sm p-8 sm:p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <Users className="w-7 h-7 text-primary" aria-hidden />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2">
            Accepting your invite
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Taking you to the group in a moment…
          </p>
          <div className="flex justify-center">
            <Loader2
              className="w-8 h-8 animate-spin text-primary"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}
