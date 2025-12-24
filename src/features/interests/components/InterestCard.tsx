
"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { Avatar } from "@heroui/react";
import { MapPin, Loader2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/button";
import InvitationCardSkeleton from "@/features/invitations/components/InvitationCardSkeleton";

export interface Interest {
  id: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    bio: string;
  };
  destination?: string;
  sentAt: string;
  status: string;
}

interface InterestCardProps {
  interest: Interest;
  isLoading?: boolean;
  onAccept: (interestId: string) => Promise<void> | void;
  onDecline: (interestId: string) => Promise<void> | void;
}

export function InterestCard({
  interest,
  onAccept,
  onDecline,
  isLoading = false,
}: InterestCardProps) {
  const router = useRouter(); 
  const [loadingAction, setLoadingAction] = useState<
    "accept" | "decline" | null
  >(null);

  if (isLoading) {
    return <InvitationCardSkeleton />;
  }

  // Format date
  const dateFormatted = new Date(interest.sentAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const handleProfileClick = () => {
    router.push(`/profile/${interest.sender.id}`);
  };

  return (
    <Card className="w-full max-w-[600px] h-[240px] rounded-2xl shadow-sm overflow-hidden flex flex-col bg-card text-card-foreground">
      <CardBody className="px-5 py-4 relative">
        {/* Profile Section with Avatar and User Info */}
        <div 
          className="flex items-center gap-4 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleProfileClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleProfileClick();
            }
          }}
        >
          {/* Sender Avatar */}
          <Avatar
            src={interest.sender.avatar || ""}
            alt={`${interest.sender.name}'s profile`}
            size="md"
          />
          {/* User Info - Right of Avatar */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h2 className="text-md font-bold text-foreground truncate">
              {interest.sender.name}
            </h2>
            <p className="text-muted-foreground text-xs truncate">
              @{interest.sender.username}
            </p>
          </div>
        </div>

        <div className="text-left mb-4 flex-1">
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
            {interest.sender.bio || "No bio provided."}
          </p>
        </div>

        {/* Interest Details */}
        <div className="text-left mb-4">
          <div className="flex flex-col gap-1.5">
            {interest.destination && (
              <div className="flex items-center gap-2">
                <MapPin
                  className="w-4 h-4 text-muted-foreground"
                  aria-label="Destination"
                />
                <span className="text-xs text-foreground font-medium">
                  Interested in {interest.destination}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Sent on {dateFormatted}</span>
            </div>
          </div>
        </div>
      </CardBody>
      
      <div className="px-5 pb-5 mt-auto">
        <div className="flex gap-2 justify-center items-center">
          <Button
            color="primary"
            className="w-1/2 gap-2 text-xs font-semibold rounded-lg"
            aria-label="Connect"
            tabIndex={0}
            disabled={!!loadingAction}
            onClick={async () => {
              setLoadingAction("accept");
              try {
                await onAccept(interest.id);
              } catch (error) {
                console.error("Error accepting interest:", error);
              } finally {
                setTimeout(() => setLoadingAction(null), 1000);
              }
            }}
          >
            {loadingAction === "accept" && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            Connect
          </Button>
          <Button
            color="primary"
            variant="outline"
            className="border-1 hover:bg-background w-1/2 gap-2 text-xs font-semibold rounded-lg"
            aria-label="Delete"
            tabIndex={0}
            disabled={!!loadingAction}
            onClick={async () => {
              setLoadingAction("decline");
              try {
                await onDecline(interest.id);
              } catch (error) {
                console.error("Error declining interest:", error);
              } finally {
                setTimeout(() => setLoadingAction(null), 1000);
              }
            }}
          >
            {loadingAction === "decline" && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
