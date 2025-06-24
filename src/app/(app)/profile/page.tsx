"use client";

import { useState, useEffect } from "react";
import InvitationResults, { GroupInvite } from "@/features/invitations/components/InvitationResults";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import InvitationCardSkeleton from "@/features/invitations/components/InvitationCardSkeleton";

export default function ProfilePage() {
  const [invitations, setInvitations] = useState<GroupInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  const fetchPendingInvitations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/pending-invitations");

      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }

      const data = await response.json();
      setInvitations(data);
    } catch (err) {
      console.error("Error fetching invitations:", err);
      setError("Failed to load invitations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const response = await fetch("/api/group-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: invitationId,
          action: "accept",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept invitation");
      }

      // Remove the accepted invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

      // Optionally redirect to the group page
      router.push(`/groups/${invitationId}/home`);
    } catch (err) {
      console.error("Error accepting invitation:", err);
      // You could show a toast notification here
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const response = await fetch("/api/group-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: invitationId,
          action: "decline",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to decline invitation");
      }

      // Remove the declined invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err) {
      console.error("Error declining invitation:", err);
      // You could show a toast notification here
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPendingInvitations();
    }
  }, [userId]);

  // Show skeleton loading while auth is loading or data is loading
  if (!isLoaded || isLoading) {
    return (
      <div className="flex flex-col w-full min-h-screen">
        <div className="w-full flex flex-row items-center gap-2 px-4 py-6">
          <Button
            className="text-primary bg-primary-light font-semibold rounded-2xl shadow-sm hover:bg-primary-light hover:text-primary border-1 border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            tabIndex={0}
            aria-label="Invitations Tab"
          >
            Invitations
          </Button>
        </div>
        <div className="w-full flex-1 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 justify-items-start">
            {Array.from({ length: 16 }).map((_, i) => (
              <InvitationCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Only show sign-in warning after auth has loaded and user is not signed in
  if (isLoaded && !userId) {
    return (
      <div className="flex flex-col w-full min-h-screen">
        <div className="w-full flex flex-row items-center gap-2 px-4 py-6">
          <Button
            className="text-primary bg-primary-light font-semibold rounded-2xl shadow-sm hover:bg-primary-light hover:text-primary border-1 border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            tabIndex={0}
            aria-label="Invitations Tab"
          >
            Invitations
          </Button>
        </div>
        <div className="w-full flex-1 px-4">
          <div className="text-center text-muted-foreground py-8">
            Please sign in to view your invitations.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Invitations Tab */}
      <div className="w-full flex flex-row items-center gap-2 px-4 py-6">
        <Button
          className="text-primary bg-primary-light font-semibold rounded-2xl shadow-sm hover:bg-primary-light hover:text-primary border-1 border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          tabIndex={0}
          aria-label="Invitations Tab"
        >
          Invitations
        </Button>
      </div>

      {/* Invitations Results Grid */}
      <div className="w-full flex-1 px-4">
        {error ? (
          <div className="text-center text-red-500 py-8" role="alert">
            {error}
            <Button
              onClick={fetchPendingInvitations}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <InvitationResults
            invitations={invitations}
            onAccept={handleAcceptInvitation}
            onDecline={handleDeclineInvitation}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
