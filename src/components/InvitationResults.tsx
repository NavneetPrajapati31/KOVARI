import React, { useState, useEffect } from "react";
import { GroupInviteCard } from "./cards/InvitationCard";
import type { GroupInvite } from "./cards/InvitationCard";
import InvitationCardSkeleton from "./skeleton/InvitationCardSkeleton";

interface InvitationResultsProps {
  invitations: GroupInvite[];
}

const SKELETON_COUNT = 12;

const InvitationResults: React.FC<InvitationResultsProps> = ({
  invitations,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 justify-items-start">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <InvitationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center text-red-500 py-8" role="alert">
        Failed to load invitations. Please try again.
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No invitations found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 justify-items-start">
      {invitations.map((invite) => (
        <GroupInviteCard
          key={invite.id}
          invite={invite}
          onAccept={() => {}}
          onDecline={() => {}}
        />
      ))}
    </div>
  );
};

export type { GroupInvite };
export default InvitationResults;
