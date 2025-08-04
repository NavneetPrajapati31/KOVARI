"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Check, X, Clock, Users, EllipsisVerticalIcon } from "lucide-react";
import { cn } from "@/shared/utils/utils";

interface ConnectionRequest {
  id: string;
  name: string;
  avatar: string;
  mutualConnections: number;
  location: string;
  timestamp: string;
  status: "pending" | "accepted" | "declined";
}

const dummyConnectionRequests: ConnectionRequest[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
    mutualConnections: 3,
    location: "New York, USA",
    timestamp: "2 hours ago",
    status: "pending",
  },
  {
    id: "2",
    name: "Michael Chen",
    avatar:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
    mutualConnections: 5,
    location: "San Francisco, USA",
    timestamp: "1 day ago",
    status: "pending",
  },
  {
    id: "3",
    name: "Emma Rodriguez",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
    mutualConnections: 2,
    location: "Barcelona, Spain",
    timestamp: "3 days ago",
    status: "pending",
  },
  {
    id: "4",
    name: "David Kim",
    avatar:
      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
    mutualConnections: 4,
    location: "Seoul, South Korea",
    timestamp: "1 week ago",
    status: "pending",
  },
  {
    id: "5",
    name: "Sarah Johnson",
    avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
    mutualConnections: 3,
    location: "New York, USA",
    timestamp: "2 hours ago",
    status: "pending",
  },
  {
    id: "6",
    name: "Michael Chen",
    avatar:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
    mutualConnections: 5,
    location: "San Francisco, USA",
    timestamp: "1 day ago",
    status: "pending",
  },
  {
    id: "7",
    name: "Emma Rodriguez",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
    mutualConnections: 2,
    location: "Barcelona, Spain",
    timestamp: "3 days ago",
    status: "pending",
  },
  {
    id: "8",
    name: "David Kim",
    avatar:
      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
    mutualConnections: 4,
    location: "Seoul, South Korea",
    timestamp: "1 week ago",
    status: "pending",
  },
];

interface ConnectionRequestCardProps {
  request: ConnectionRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  className?: string;
}

function ConnectionRequestCard({
  request,
  onAccept,
  onDecline,
  className,
}: ConnectionRequestCardProps) {
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
          <AvatarFallback className="bg-white border border-border text-neutral-300">
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
      <div className="flex items-center space-x-1 flex-shrink-0">
        <button
          className="bg-primary text-primary-foreground text-xs p-1 px-2 rounded-md whitespace-nowrap"
          onClick={() => onAccept(request.id)}
        >
          <span className="text-[10px]">Accept</span>
        </button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={() => onDecline(request.id)}
        >
          <EllipsisVerticalIcon className="h-3 w-3 !text-muted-foreground" />
        </Button>
      </div>
    </Card>
  );
}

export const ConnectionRequestsCard = () => {
  const [requests, setRequests] = useState<ConnectionRequest[]>(
    dummyConnectionRequests
  );

  const handleAccept = (id: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: "accepted" as const } : req
      )
    );
  };

  const handleDecline = (id: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: "declined" as const } : req
      )
    );
  };

  const pendingRequests = requests.filter((req) => req.status === "pending");

  return (
    <div className="w-full bg-card border border-border rounded-xl h-full flex flex-col max-h-[85vh]">
      <div className="mb-3 p-4 border-b border-border flex-shrink-0">
        <h2 className="text-foreground font-semibold text-xs truncate">
          Connection Requests
        </h2>
        <p className="mt-0.5 text-muted-foreground text-xs">
          {pendingRequests.length} pending requests
        </p>
      </div>

      <div className="w-full mx-auto bg-transparent rounded-none shadow-none overflow-y-auto px-4 hide-scrollbar flex-1">
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No pending requests
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                New connection requests will appear here
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
