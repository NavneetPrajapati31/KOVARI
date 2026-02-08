"use client";
import React, { useEffect, useState } from "react";
import {
  Avatar,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { UserAvatarFallback } from "@/shared/components/UserAvatarFallback";
import { Button } from "@/shared/components/ui/button";
import { Chip } from "@heroui/react";
import { useParams } from "next/navigation";
import { Loader2, X } from "lucide-react";

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  // Fetch current user's internal user ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const res = await fetch("/api/profile/current");
        if (!res.ok) return;
        const data = await res.json();
        setCurrentUserId(data.id); // assuming API returns { id: ... }
      } catch {
        setCurrentUserId(null);
      }
    };
    fetchCurrentUserId();
  }, []);

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
    console.log("[REQUESTS_PAGE] useEffect running", {
      groupId,
      currentUserId,
    });
    if (!groupId || !currentUserId) return;
    const fetchMembership = async () => {
      try {
        const res = await fetch(`/api/groups/${groupId}/members`);
        if (!res.ok) return;
        const data = await res.json();
        console.log("[REQUESTS_PAGE] Fetched members:", data.members);
        // Log both id and userIdFromUserTable for each member
        console.log(
          "[REQUESTS_PAGE] Checking member match:",
          data.members?.map((m: any) => ({
            id: m.id,
            userIdFromUserTable: m.userIdFromUserTable,
            matches: m.id === currentUserId,
            matchesUserTable: m.userIdFromUserTable === currentUserId,
          }))
        );
        // Compare using both fields
        const current = (data.members || []).find(
          (m: any) =>
            m.id === currentUserId || m.userIdFromUserTable === currentUserId
        );
        console.log(
          "[REQUESTS_PAGE] My role in this group:",
          current?.role || "unknown"
        );
        const isAdmin = current?.role === "admin";
        setIsCurrentUserAdmin(isAdmin);
        // Log current user's role
        console.log(
          `[REQUESTS_PAGE] Current user role: ${current?.role || "unknown"}, Is admin: ${isAdmin}`
        );
      } catch {
        setIsCurrentUserAdmin(false);
        console.log(
          `[REQUESTS_PAGE] Error fetching membership, setting admin to false`
        );
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
      <div className="space-y-1 mb-4">
        <h1 className="text-md font-bold text-foreground">Join Requests</h1>
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
                    <UserAvatarFallback />
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
                      className="text-sm capitalize flex-shrink-0 self-center bg-secondary text-muted-foreground px-2"
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
                          className="text-primary-foreground bg-primary px-3 py-1 h-7 text-xs rounded-lg"
                          onClick={() => handleApproveRequest(request)}
                          aria-label={`Approve ${request.name}`}
                          tabIndex={0}
                          disabled={
                            approveLoadingId === request.id ||
                            rejectLoadingId === request.id
                          }
                        >
                          {approveLoadingId === request.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
                          ) : (
                            "Approve"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="px-3 py-1 h-7 w-7 text-xs rounded-lg"
                          onClick={() => handleRejectRequest(request)}
                          aria-label={`Reject ${request.name}`}
                          tabIndex={0}
                          disabled={
                            rejectLoadingId === request.id ||
                            approveLoadingId === request.id
                          }
                        >
                          {rejectLoadingId === request.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
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
                    <UserAvatarFallback />
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
                    className="text-sm capitalize flex-shrink-0 self-center bg-secondary text-muted-foreground px-2"
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
                        className="text-primary-foreground bg-primary px-3 py-1 h-7 text-xs rounded-lg"
                        onClick={() => handleApproveRequest(request)}
                        aria-label={`Approve ${request.name}`}
                        tabIndex={0}
                        disabled={
                          approveLoadingId === request.id ||
                          rejectLoadingId === request.id
                        }
                      >
                        {approveLoadingId === request.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
                        ) : (
                          "Approve"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="px-3 py-1 h-7 w-7 text-xs rounded-lg"
                        onClick={() => handleRejectRequest(request)}
                        aria-label={`Reject ${request.name}`}
                        tabIndex={0}
                        disabled={
                          rejectLoadingId === request.id ||
                          approveLoadingId === request.id
                        }
                      >
                        {rejectLoadingId === request.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
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
      {/* Empty state - no pending requests */}
      {!isJoinRequestsLoading &&
        !joinRequestsError &&
        joinRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="rounded-full bg-muted/50 p-4 mb-4"></div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              No pending requests
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              There are no join requests awaiting review. New requests will
              appear here when users ask to join this group.
            </p>
          </div>
        )}
    </div>
  );
}
