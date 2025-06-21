import React, { useState, useEffect } from "react";
import { GroupInviteCard } from "./cards/InvitationCard";
import type { GroupInvite } from "./cards/InvitationCard";

interface InvitationResultsProps {
  invitations: GroupInvite[];
  onAccept?: (invitationId: string) => void;
  onDecline?: (invitationId: string) => void;
  isLoading?: boolean;
}

const InvitationResults: React.FC<InvitationResultsProps> = ({
  invitations,
  onAccept,
  onDecline,
  isLoading: externalLoading = false,
}) => {
  const [hasError, setHasError] = useState(false);

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
          onAccept={() => onAccept?.(invite.id)}
          onDecline={() => onDecline?.(invite.id)}
        />
      ))}
    </div>
  );
};

export type { GroupInvite };
export default InvitationResults;
