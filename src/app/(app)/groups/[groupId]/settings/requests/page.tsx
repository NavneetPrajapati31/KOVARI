"use client";
import React, { useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Chip } from "@heroui/react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/shared/stores/useAuthStore";

interface JoinRequest {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar: string;
  requestedAt: string;
}

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function RequestsPage() {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isJoinRequestsLoading, setIsJoinRequestsLoading] = useState(true);
  const [joinRequestsError, setJoinRequestsError] = useState<string | null>(
    null
  );
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null);
  const [rejectLoadingId, setRejectLoadingId] = useState<string | null>(null);
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  // Fetch join requests
  useEffect(() => {
    if (!groupId) return;
    const fetchJoinRequests = async () => {
      setIsJoinRequestsLoading(true);
      setJoinRequestsError(null);
      try {
        const res = await fetch(`/api/groups/${groupId}/join-request`);
        if (!res.ok) throw new Error("Failed to fetch join requests");
        const data = await res.json();
        setJoinRequests(data.joinRequests || []);
      } catch (err: unknown) {
        setJoinRequestsError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsJoinRequestsLoading(false);
      }
    };
    fetchJoinRequests();
  }, [groupId]);

  // Check if current user is admin (fetch from /members API)
  useEffect(() => {
    if (!groupId || !currentUserId) return;
    const fetchMembership = async () => {
      try {
        const res = await fetch(`/api/groups/${groupId}/members`);
        if (!res.ok) return;
        const data = await res.json();
        const current = (data.members || []).find(
          (m: any) => m.clerkId === currentUserId
        );
        setIsCurrentUserAdmin(current?.role === "admin");
      } catch {
        setIsCurrentUserAdmin(false);
      }
    };
    fetchMembership();
  }, [groupId, currentUserId]);

  // Approve join request
  const handleApproveRequest = async (request: JoinRequest) => {
    setApproveLoadingId(request.id);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: request.userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve request");
      }
      setJoinRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setApproveLoadingId(null);
    }
  };

  // Reject join request
  const handleRejectRequest = async (request: JoinRequest) => {
    setRejectLoadingId(request.id);
    try {
      const res = await fetch(`/api/groups/${groupId}/join-request`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject request");
      }
      setJoinRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setRejectLoadingId(null);
    }
  };

  return (
    <div className="w-full mx-auto p-4 space-y-6">
      <div className="space-y-2 mb-4">
        <h1 className="text-md sm:text-lg font-bold text-foreground">
          Join Requests
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
          Approve or reject pending join requests for this group. Only admins
          can take action.
        </p>
      </div>
      {/* Desktop Table View */}
      {!isJoinRequestsLoading &&
        !joinRequestsError &&
        joinRequests.length > 0 && (
          <div className="hidden lg:block">
            <div className="bg-card rounded-xl border border-border mt-6">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 rounded-t-xl border-b border-border bg-gray-100">
                <div className="col-span-3 text-xs font-medium text-foreground">
                  Name
                </div>
                <div className="col-span-2 text-xs font-medium text-foreground">
                  Username
                </div>
                <div className="col-span-2 text-xs font-medium text-foreground">
                  Status
                </div>
                <div className="col-span-3 text-xs font-medium text-foreground">
                  Date
                </div>
                <div className="col-span-2 text-xs font-medium text-foreground"></div>
              </div>
              {joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border last:border-b-0 hover:bg-gray-50 hover:rounded-xl hover:last:rounded-t-none items-center"
                >
                  <div className="col-span-3 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={request.avatar || ""}
                        alt={request.name}
                      />
                      <AvatarFallback>
                        {request.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground text-sm">
                      {request.name}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-muted-foreground text-sm">
                      {request.username}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Chip
                      size="sm"
                      variant="bordered"
                      className="text-sm capitalize flex-shrink-0 self-center bg-yellow-100 border-1 border-yellow-400 text-yellow-700 px-2"
                    >
                      <span className="font-medium text-xs">Pending</span>
                    </Chip>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="text-muted-foreground text-sm">
                      {formatDate(request.requestedAt)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {isCurrentUserAdmin && (
                      <>
                        <Button
                          variant="outline"
                          className="text-success hover:text-success hover:bg-success/10 border-success bg-success/10 px-3 py-1 h-auto text-xs"
                          onClick={() => handleApproveRequest(request)}
                          aria-label={`Approve ${request.name}`}
                          tabIndex={0}
                          disabled={
                            approveLoadingId === request.id ||
                            rejectLoadingId === request.id
                          }
                        >
                          {approveLoadingId === request.id
                            ? "Approving..."
                            : "Approve"}
                        </Button>
                        <Button
                          variant="outline"
                          className="text-destructive border-destructive bg-destructive/10 hover:text-destructive hover:bg-destructive/10 px-3 py-1 h-auto text-xs"
                          onClick={() => handleRejectRequest(request)}
                          aria-label={`Reject ${request.name}`}
                          tabIndex={0}
                          disabled={
                            rejectLoadingId === request.id ||
                            approveLoadingId === request.id
                          }
                        >
                          {rejectLoadingId === request.id
                            ? "Rejecting..."
                            : "Reject"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      {/* Mobile/Tablet Card View */}
      {!isJoinRequestsLoading &&
        !joinRequestsError &&
        joinRequests.length > 0 && (
          <div className="lg:hidden space-y-4">
            {joinRequests.map((request) => (
              <div
                key={request.id}
                className="bg-card rounded-xl border border-border p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={request.avatar || ""}
                      alt={request.name}
                    />
                    <AvatarFallback>
                      {request.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate text-sm">
                      {request.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      @{request.username}
                    </p>
                  </div>
                  <Chip
                    size="sm"
                    variant="bordered"
                    className="text-sm capitalize flex-shrink-0 self-center bg-yellow-100 border-1 border-yellow-400 text-yellow-700 px-2"
                  >
                    <span className="font-medium text-xs">Pending</span>
                  </Chip>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {formatDate(request.requestedAt)}
                  </div>
                  {isCurrentUserAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="text-success hover:text-success hover:bg-success/10 border-success bg-success/10 px-3 py-1 h-auto text-xs"
                        onClick={() => handleApproveRequest(request)}
                        aria-label={`Approve ${request.name}`}
                        tabIndex={0}
                        disabled={
                          approveLoadingId === request.id ||
                          rejectLoadingId === request.id
                        }
                      >
                        {approveLoadingId === request.id
                          ? "Approving..."
                          : "Approve"}
                      </Button>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive bg-destructive/10 hover:text-destructive hover:bg-destructive/10 px-3 py-1 h-auto text-xs"
                        onClick={() => handleRejectRequest(request)}
                        aria-label={`Reject ${request.name}`}
                        tabIndex={0}
                        disabled={
                          rejectLoadingId === request.id ||
                          approveLoadingId === request.id
                        }
                      >
                        {rejectLoadingId === request.id
                          ? "Rejecting..."
                          : "Reject"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      {/* Join Requests Loading/Error States */}
      {isJoinRequestsLoading && (
        <>
          {/* Desktop Skeleton */}
          <div className="hidden lg:block bg-card rounded-xl border border-border mt-6 animate-pulse">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 rounded-t-xl border-b border-border bg-gray-100">
              <div className="col-span-3 text-xs font-medium text-foreground">
                Name
              </div>
              <div className="col-span-2 text-xs font-medium text-foreground">
                Username
              </div>
              <div className="col-span-2 text-xs font-medium text-foreground">
                Status
              </div>
              <div className="col-span-3 text-xs font-medium text-foreground">
                Date
              </div>
              <div className="col-span-2 text-xs font-medium text-foreground"></div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border last:border-b-0 items-center"
              >
                <div className="col-span-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
                <div className="col-span-2 flex items-center">
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
                <div className="col-span-2 flex items-center">
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
                <div className="col-span-3 flex items-center">
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
          {/* Mobile/Tablet Skeleton */}
          <div className="lg:hidden space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border gap-2">
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {joinRequestsError && (
        <div className="w-full flex justify-center py-6">
          <span className="text-destructive">{joinRequestsError}</span>
        </div>
      )}
    </div>
  );
}
