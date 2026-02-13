"use client";

import { useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { Avatar, AvatarImage } from "@/shared/components/ui/avatar";
import { UserAvatarFallback } from "@/shared/components/UserAvatarFallback";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import InvitationCardSkeleton from "@/features/invitations/components/InvitationCardSkeleton";
import { useRouter } from "next/navigation";

export interface GroupInvite {
  id: string;
  groupName: string;
  groupCoverImage?: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    initials: string;
  };
  destination?: string;
  dates?: string;
  description: string;
  teamMembers: {
    avatar: string;
    initials: string;
    color: string;
  }[];
  acceptedCount: number;
  expiresInDays: number;
  inviteDate: string;
}

interface GroupInviteCardProps {
  invite: GroupInvite;
  isLoading?: boolean;
  onAccept: (invitationId: string) => Promise<void> | void;
  onDecline: (invitationId: string) => Promise<void> | void;
}

export function GroupInviteCard({
  invite,
  onAccept,
  onDecline,
  isLoading = false,
}: GroupInviteCardProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<
    "accept" | "decline" | null
  >(null);
  const [isAccepted, setIsAccepted] = useState(false);

  const handleCreatorClick = () => {
    if (!invite.creator?.id) return;
    router.push(`/profile/${invite.creator.id}`);
  };

  if (isLoading) {
    return <InvitationCardSkeleton />;
  }

  return (
    <div className="w-full max-w-[600px] border border-border rounded-xl bg-card text-card-foreground p-4 flex flex-col gap-4 shadow-sm">
      {/* Header: User Info & Timestamp */}
      <div className="flex justify-between items-start">
        {/* User Info */}
        <div className="flex items-center gap-3 cursor-pointer group flex-1">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage
              src={invite.groupCoverImage || ""}
              alt={`${invite.groupName || invite.creator.name}'s profile`}
            />
            <UserAvatarFallback className="" />
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex justify-between items-start gap-2 w-full">
              <span className="text-sm font-semibold text-foreground truncate">
                {invite.groupName}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                {invite.inviteDate
                  ? new Date(invite.inviteDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : ""}
              </span>
            </div>
            <span
              className="text-xs text-muted-foreground truncate cursor-pointer"
              onClick={handleCreatorClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCreatorClick();
                }
              }}
              aria-label={`View @${invite.creator.username}'s profile`}
            >
              Invited by @{invite.creator.username}
            </span>
          </div>
        </div>
      </div>

      {/* Content: Destination & Bio */}
      <div className="flex flex-col gap-3 py-1">
        {invite.destination && (
          <div className="flex items-start gap-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Let's plan a trip together to
              </span>
              <span className="text-sm font-semibold text-foreground leading-tight capitalize">
                {invite.destination}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto pt-2">
        {isAccepted ? (
          <div className="w-full h-9 flex items-center justify-center text-xs font-medium text-primary-foreground bg-primary rounded-lg">
            You're in! Plan the trip.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="w-full h-9 text-xs font-semibold rounded-lg border-border hover:bg-accent/50"
              disabled={!!loadingAction}
              onClick={async () => {
                setLoadingAction("decline");
                try {
                  await onDecline(invite.id);
                } catch (error) {
                  console.error("Error declining invitation:", error);
                } finally {
                  setLoadingAction(null);
                }
              }}
            >
              {loadingAction === "decline" ? (
                <Spinner
                  variant="spinner"
                  size="sm"
                  classNames={{ spinnerBars: "bg-foreground" }}
                />
              ) : (
                "Decline"
              )}
            </Button>

            <Button
              className="w-full h-9 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!!loadingAction}
              onClick={async () => {
                setLoadingAction("accept");
                try {
                  await onAccept(invite.id);
                  setIsAccepted(true);
                } catch (error) {
                  console.error("Error accepting invitation:", error);
                } finally {
                  setLoadingAction(null);
                }
              }}
            >
              {loadingAction === "accept" ? (
                <Spinner
                  variant="spinner"
                  size="sm"
                  classNames={{ spinnerBars: "bg-primary-foreground" }}
                />
              ) : (
                "Accept"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
