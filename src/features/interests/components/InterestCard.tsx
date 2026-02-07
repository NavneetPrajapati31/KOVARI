
"use client";

import { useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
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
    <div className="w-full max-w-[600px] border border-border rounded-xl bg-card text-card-foreground p-4 flex flex-col gap-4 shadow-sm">
      {/* Header: User Info & Timestamp */}
      <div className="flex justify-between items-start">
        {/* User Info */}
        <div 
          className="flex items-center gap-3 cursor-pointer group flex-1"
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
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage
              src={interest.sender.avatar || ""}
              alt={`${interest.sender.name}'s profile`}
            />
            <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="8" r="4" />
                <rect x="4" y="14" width="16" height="6" rx="3" />
              </svg>
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
             <div className="flex justify-between items-start gap-2 w-full">
               <span className="text-sm font-semibold text-foreground truncate">
                  {interest.sender.name}
               </span>
               <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                 {dateFormatted}
               </span>
             </div>
             <span className="text-xs text-muted-foreground truncate">
               @{interest.sender.username}
             </span>
          </div>
        </div>
      </div>

      {/* Content: Destination & Bio */}
      <div className="flex flex-col gap-3 py-1">
         {interest.destination && (
            <div className="flex items-start gap-2.5">
               <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                     Interested in traveling to
                  </span>
                  <span className="text-sm font-semibold text-foreground leading-tight">
                     {interest.destination}
                  </span>
               </div>
            </div>
         )}
      </div>

       {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
          <Button
            variant="outline"
            className="w-full h-9 text-xs font-semibold rounded-lg border-border hover:bg-accent/50"
            disabled={!!loadingAction}
            onClick={async () => {
              setLoadingAction("decline");
              try {
                await onDecline(interest.id);
              } catch (error) {
                console.error("Error declining interest:", error);
              } finally {
               setLoadingAction(null);
              }
            }}
          >
             {loadingAction === "decline" ? (
              <Spinner variant="spinner"
                              size="sm"
                              classNames={{ spinnerBars: "bg-foreground" }}
                            />
            ) : "Delete"}
          </Button>

          <Button
            className="w-full h-9 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!!loadingAction}
            onClick={async () => {
              setLoadingAction("accept");
              try {
                await onAccept(interest.id);
              } catch (error) {
                console.error("Error accepting interest:", error);
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
            ) : "Connect"}
          </Button>
      </div>
    </div>
  );
}
