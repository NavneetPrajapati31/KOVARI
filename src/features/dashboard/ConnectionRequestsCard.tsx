"use client";

import { useState, useEffect } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@heroui/react";
import { Check, X, Clock, Users, Trash2, Loader2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/shared/utils/utils";
import * as Sentry from "@sentry/nextjs";

interface ConnectionRequest {
  id: string;
  name: string;
  avatar: string;
  mutualConnections: number;
  location: string;
  timestamp: string;
  status: "pending" | "accepted" | "declined";
}

interface ApiInterest {
  id: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    bio: string;
    location?: string;
    mutualConnections?: number;
  };
  destination: string;
  sentAt: string;
  status: string;
}

interface ConnectionRequestCardProps {
  request: ConnectionRequest;
  onAccept: (id: string) => Promise<void> | void;
  onDecline: (id: string) => Promise<void> | void;
  className?: string;
}

function ConnectionRequestCard({
  request,
  onAccept,
  onDecline,
  className,
}: ConnectionRequestCardProps) {
  const [loadingAction, setLoadingAction] = useState<
    "accept" | "decline" | null
  >(null);

  return (
    <Card
      className={cn(
        "flex flex-row items-center gap-x-2 py-0 bg-card text-foreground shadow-none border-none",
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={request.avatar} alt={request.name} />
          <AvatarFallback className="bg-card border border-border text-muted-foreground">
            {request.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col min-w-0">
          <h3 className="font-semibold text-xs truncate">{request.name}</h3>
          <p className="text-xs text-foreground truncate mt-0.5">
            {request.location}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <Button
          size="sm"
          className="bg-primary text-primary-foreground text-xs h-7 px-3 rounded-md whitespace-nowrap gap-2"
          disabled={!!loadingAction}
          onClick={async () => {
            setLoadingAction("accept");
            try {
              await onAccept(request.id);
            } catch (error) {
              console.error("Error accepting request:", error);
            } finally {
              setTimeout(() => setLoadingAction(null), 1000);
            }
          }}
        >
          {loadingAction === "accept" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
          )}
          {!loadingAction && <span>Connect</span>}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 flex-shrink-0"
          disabled={!!loadingAction}
          onClick={async () => {
            setLoadingAction("decline");
            try {
              await onDecline(request.id);
            } catch (error) {
              console.error("Error declining request:", error);
            } finally {
              setTimeout(() => setLoadingAction(null), 1000);
            }
          }}
        >
          {loadingAction === "decline" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </div>
    </Card>
  );
}

const REQUEST_SKELETON_ROW_COUNT = 7;

/** Skeleton row matching ConnectionRequestCard: avatar, name + location, Connect + X buttons */
function ConnectionRequestCardSkeletonRow() {
  return (
    <Card className="flex flex-row items-center gap-x-2 py-0 bg-card text-foreground shadow-none border-none">
      <div className="flex-shrink-0">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col min-w-0 space-y-1">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </Card>
  );
}

function MatchRequestsSkeleton() {
  return (
    <div className="min-h-[10rem] space-y-3" aria-hidden aria-busy>
      {Array.from({ length: REQUEST_SKELETON_ROW_COUNT }).map((_, idx) => (
        <ConnectionRequestCardSkeletonRow key={idx} />
      ))}
    </div>
  );
}

export const ConnectionRequestsCard = () => {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectionRequests();
  }, []);

  const fetchConnectionRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      await Sentry.startSpan(
        {
          op: "http.client",
          name: "GET /api/interests",
        },
        async (span) => {
          const response = await fetch("/api/interests");

          if (!response.ok) {
            throw new Error("Failed to fetch connection requests");
          }

          const data: ApiInterest[] = await response.json();

          // Transform API response to component format
          const transformedRequests: ConnectionRequest[] = data.map(
            (interest) => {
              // Normalize status: "rejected" -> "declined"
              let status: "pending" | "accepted" | "declined" = "pending";
              if (interest.status === "accepted") {
                status = "accepted";
              } else if (
                interest.status === "rejected" ||
                interest.status === "declined"
              ) {
                status = "declined";
              }

              return {
                id: interest.id,
                name: interest.sender.name,
                avatar: interest.sender.avatar || "",
                mutualConnections: interest.sender.mutualConnections || 0,
                location: interest.sender.location || "Unknown Location",
                timestamp: formatRelativeTime(interest.sentAt),
                status,
              };
            }
          );

          setRequests(transformedRequests);
          span.setAttribute("count", transformedRequests.length);
        }
      );
    } catch (err: any) {
      console.error("Error fetching connection requests:", err);
      Sentry.captureException(err);
      setError("Failed to load connection requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string): Promise<void> => {
    try {
      Sentry.startSpan(
        {
          op: "ui.click",
          name: "Accept Connection Request",
        },
        async (span) => {
          const response = await fetch("/api/interests/respond", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              interestId: id,
              action: "accept",
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to accept request");
          }

          // Remove the accepted request from the list
          setRequests((prev) => prev.filter((req) => req.id !== id));
          span.setAttribute("interestId", id);
        }
      );
    } catch (err: any) {
      console.error("Error accepting request:", err);
      Sentry.captureException(err);
      throw err; // Re-throw to let the card component handle it
    }
  };

  const handleDecline = async (id: string): Promise<void> => {
    try {
      Sentry.startSpan(
        {
          op: "ui.click",
          name: "Decline Connection Request",
        },
        async (span) => {
          const response = await fetch("/api/interests/respond", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              interestId: id,
              action: "decline",
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to decline request");
          }

          // Remove the declined request from the list
          setRequests((prev) => prev.filter((req) => req.id !== id));
          span.setAttribute("interestId", id);
        }
      );
    } catch (err: any) {
      console.error("Error declining request:", err);
      Sentry.captureException(err);
      throw err; // Re-throw to let the card component handle it
    }
  };

  const pendingRequests = requests.filter((req) => req.status === "pending");

  return (
    <div className="w-full bg-card border border-border rounded-xl h-full flex flex-col max-h-[85vh]">
      <div className="mb-3 p-4 border-b border-border flex-shrink-0">
        <h2 className="text-foreground font-semibold text-xs truncate">
          Interests
        </h2>
        <p className="mt-0.5 text-muted-foreground text-xs">
          {pendingRequests.length} pending interests
        </p>
      </div>

      <div className="w-full mx-auto bg-transparent rounded-none shadow-none overflow-y-auto px-4 pb-3 hide-scrollbar flex-1">
        <div className="space-y-3">
          {loading ? (
            <MatchRequestsSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              {/* <Clock className="h-8 w-8 text-muted-foreground mb-2" /> */}
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchConnectionRequests}
              >
                Retry
              </Button>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              {/* <Clock className="h-8 w-8 text-muted-foreground mb-2" /> */}
              <p className="text-xs text-muted-foreground">
                No pending interests
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                New match interests will appear here
              </p>
            </div>
          ) : (
            pendingRequests.map((request) => (
              <ConnectionRequestCard
                key={request.id}
                request={request}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
