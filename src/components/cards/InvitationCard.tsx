"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { Avatar } from "@heroui/react";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import InvitationCardSkeleton from "../skeleton/InvitationCardSkeleton";

export interface GroupInvite {
  id: string;
  groupName: string;
  creator: {
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
  const [loadingAction, setLoadingAction] = useState<
    "accept" | "decline" | null
  >(null);

  if (isLoading) {
    return <InvitationCardSkeleton />;
  }

  return (
    <Card className="w-full max-w-[600px] h-[240px] rounded-2xl shadow-sm overflow-hidden flex flex-col bg-card text-card-foreground">
      <CardBody className="px-5 py-4 relative">
        {/* Profile Section with Avatar and User Info */}
        <div className="flex items-center gap-4 mb-2">
          {/* Creator Avatar */}
          <Avatar
            src={invite.creator.avatar || "/placeholder.svg"}
            alt={`${invite.creator.name}'s profile`}
            size="md"
          />
          {/* Group Info - Right of Avatar */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h2 className="text-md font-bold text-foreground truncate">
              {invite.groupName}
            </h2>
            <p className="text-muted-foreground text-xs truncate">
              by @{invite.creator.username}
            </p>
          </div>
        </div>

        <div className="text-left mb-4">
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
            {invite.description}
          </p>
        </div>

        {/* Invitation Details */}
        <div className="text-left">
          {invite.dates && (
            <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">{invite.dates}</span>
            </div>
          )}
          {invite.destination && (
            <div className="flex items-center gap-2">
              <MapPin
                className="w-4 h-4 text-muted-foreground"
                aria-label="Destination"
              />
              <span className="text-xs text-foreground">
                {invite.destination}
              </span>
            </div>
          )}
        </div>

        {/* Member Avatars Row with Count and Text */}
        {/* {invite.teamMembers && invite.teamMembers.length > 0 && (
          <div className="flex items-center gap-3 mt-4 mb-2">
            <div className="flex -space-x-2">
              {invite.teamMembers.slice(0, 2).map((member, idx) => (
                <Avatar
                  key={idx}
                  src={member.avatar || "/placeholder.svg"}
                  alt={member.initials}
                  size="sm"
                  className={`border-2 border-white ${member.color}`}
                />
              ))}
              {invite.teamMembers.length < invite.acceptedCount && (
                <div className="w-7 h-7 flex items-center justify-center rounded-full bg-violet-300 text-white text-xs font-semibold border-2 border-white">
                  +{invite.acceptedCount - invite.teamMembers.length}
                </div>
              )}
            </div>
            <span className="text-muted-foreground text-xs line-clamp-2">
              {invite.acceptedCount} people already joined the group including{" "}
              {invite.teamMembers[0]?.initials || "a member"}.
            </span>
          </div>
        )} */}
      </CardBody>
      <div className="px-5 pb-5 mt-auto">
        <div className="flex gap-2 justify-center items-center">
          <Button
            color="primary"
            className="w-1/2 gap-2 text-xs font-semibold rounded-lg"
            aria-label="Accept Invitation"
            tabIndex={0}
            disabled={!!loadingAction}
            onClick={async () => {
              setLoadingAction("accept");
              try {
                await onAccept(invite.id);
              } catch (error) {
                console.error("Error accepting invitation:", error);
              } finally {
                setTimeout(() => setLoadingAction(null), 1000);
              }
            }}
          >
            {loadingAction === "accept" && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            Accept
          </Button>
          <Button
            color="primary"
            variant="outline"
            className="border-1 w-1/2 gap-2 text-xs font-semibold rounded-lg"
            aria-label="Decline Invitation"
            tabIndex={0}
            disabled={!!loadingAction}
            onClick={async () => {
              setLoadingAction("decline");
              try {
                await onDecline(invite.id);
              } catch (error) {
                console.error("Error declining invitation:", error);
              } finally {
                setTimeout(() => setLoadingAction(null), 1000);
              }
            }}
          >
            {loadingAction === "decline" && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            Decline
          </Button>
        </div>
      </div>
    </Card>
  );
}
