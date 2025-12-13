"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { ConfirmDialog } from "./ConfirmDialog";
import { ToastContainer, useToast } from "./Toast";
import { cn } from "../lib/utils";

interface Group {
  id: string;
  name: string;
  destination: string | null;
  description: string | null;
  notes: string | null;
  status: string;
  flag_count: number;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  is_public: boolean | null;
  budget: number;
  cover_image: string | null;
  creator_id: string | null;
  members_count: number;
  dominant_languages: string[] | null;
  top_interests: string[] | null;
  non_smokers: boolean | null;
  non_drinkers: boolean | null;
  average_age: number | null;
  destination_lat: number | null;
  destination_lon: number | null;
  removed_reason: string | null;
  removed_at: string | null;
}

interface Organizer {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  profile_photo: string | null;
}

interface Flag {
  id: string;
  group_id: string;
  reporter_id: string | null;
  reason: string | null;
  evidence_url: string | null;
  status: string;
  created_at: string;
}

interface AdminAction {
  id: string;
  action: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admins: {
    id: string;
    email: string;
  } | null;
}

interface GroupDetailProps {
  group: Group;
  organizer: Organizer | null;
  membersCount: number;
  images: Array<{
    id: string;
    url: string;
    type: string;
    uploaded_by: string | null;
    created_at: string;
  }>;
  flags: Flag[];
  adminActions: AdminAction[];
}

export function GroupDetail({
  group,
  organizer,
  membersCount,
  flags,
  adminActions,
}: GroupDetailProps) {
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [removeReason, setRemoveReason] = React.useState("");

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${group.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve group");
      }

      toast({
        title: "Success",
        description: "Group approved successfully",
        variant: "success",
      });

      setApproveDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error approving group:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to approve group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeReason.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${group.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          reason: removeReason.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove group");
      }

      toast({
        title: "Success",
        description: "Group removed successfully",
      });

      setRemoveDialogOpen(false);
      setRemoveReason("");
      router.refresh();
    } catch (error) {
      console.error("Error removing group:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      active: {
        bg: "bg-green-100 dark:bg-green-900",
        text: "text-green-800 dark:text-green-100",
      },
      pending: {
        bg: "bg-yellow-100 dark:bg-yellow-900",
        text: "text-yellow-800 dark:text-yellow-100",
      },
      removed: {
        bg: "bg-red-100 dark:bg-red-900",
        text: "text-red-800 dark:text-red-100",
      },
    };

    const variant = variants[status] || variants.pending;

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
          variant.bg,
          variant.text
        )}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Group Summary */}
        <div className="rounded-md border p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">{group.name}</h1>
                {getStatusBadge(group.status)}
                {group.flag_count > 0 && (
                  <span
                    className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                    title="Flagged group"
                  >
                    {group.flag_count} flag{group.flag_count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {group.destination && (
                <p className="text-muted-foreground">{group.destination}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label className="text-xs text-muted-foreground">
                Start Date
              </Label>
              <p className="text-sm font-medium">
                {formatDate(group.start_date)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <p className="text-sm font-medium">
                {formatDate(group.end_date)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Budget</Label>
              <p className="text-sm font-medium">
                ₹{group.budget.toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Visibility
              </Label>
              <p className="text-sm font-medium">
                {group.is_public ? "Public" : "Private"}
              </p>
            </div>
            {group.description && (
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Description
                </Label>
                <p className="text-sm mt-1">{group.description}</p>
              </div>
            )}
            {group.removed_reason && (
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Removal Reason
                </Label>
                <p className="text-sm mt-1 text-red-600 dark:text-red-400">
                  {group.removed_reason}
                </p>
                {group.removed_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Removed on {formatDateTime(group.removed_at)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Organizer Info */}
        {organizer && (
          <div className="rounded-md border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Organizer</h2>
            <div className="flex items-center gap-4">
              {organizer.profile_photo ? (
                <img
                  src={organizer.profile_photo}
                  alt={organizer.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {organizer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{organizer.name}</p>
                  {organizer.verified && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {organizer.email}
                </p>
              </div>
              <Link href={`/users/${organizer.id}`}>
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Members Overview */}
        <div className="rounded-md border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Members</h2>
          <div className="flex items-center gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Total Members
              </Label>
              <p className="text-2xl font-semibold">{membersCount}</p>
            </div>
            {group.average_age && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Average Age
                </Label>
                <p className="text-2xl font-semibold">
                  {group.average_age.toFixed(1)}
                </p>
              </div>
            )}
          </div>
          {(group.dominant_languages && group.dominant_languages.length > 0) ||
          (group.top_interests && group.top_interests.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              {group.dominant_languages &&
                group.dominant_languages.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Languages
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {group.dominant_languages.map((lang, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              {group.top_interests && group.top_interests.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Interests
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {group.top_interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Flags & Reports */}
        {flags.length > 0 && (
          <div className="rounded-md border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Flags & Reports</h2>
            <div className="space-y-3">
              {flags.map((flag) => (
                <div key={flag.id} className="rounded-md border p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {flag.reason || "No reason provided"}
                      </p>
                      {flag.evidence_url && (
                        <a
                          href={flag.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          View Evidence →
                        </a>
                      )}
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                        flag.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                          : flag.status === "resolved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {flag.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reported on {formatDateTime(flag.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Actions Panel */}
        <div className="rounded-md border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Admin Actions</h2>
          <div className="flex gap-2">
            {group.status === "pending" && (
              <Button
                onClick={() => setApproveDialogOpen(true)}
                disabled={isLoading}
              >
                Approve Group
              </Button>
            )}
            {group.status !== "removed" && (
              <Button
                variant="destructive"
                onClick={() => setRemoveDialogOpen(true)}
                disabled={isLoading}
              >
                Remove Group
              </Button>
            )}
          </div>

          {/* Previous Admin Actions */}
          {adminActions.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <h3 className="text-sm font-medium">Action History</h3>
              <div className="space-y-2">
                {adminActions.map((action) => (
                  <div key={action.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium">{action.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(action.created_at)}
                      </p>
                    </div>
                    {action.reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {action.reason}
                      </p>
                    )}
                    {action.metadata &&
                      Object.keys(action.metadata).length > 0 && (
                        <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs space-y-1">
                          {action.metadata.previousStatus != null &&
                            action.metadata.newStatus != null && (
                              <p>
                                <span className="font-medium">Status:</span>{" "}
                                <span className="text-muted-foreground">
                                  {String(action.metadata.previousStatus)} →{" "}
                                  {String(action.metadata.newStatus)}
                                </span>
                              </p>
                            )}
                          {action.metadata.flagCount !== undefined && (
                            <p>
                              <span className="font-medium">Flag Count:</span>{" "}
                              <span className="text-muted-foreground">
                                {String(action.metadata.flagCount)}
                                {action.metadata.newFlagCount !== undefined &&
                                  ` → ${String(action.metadata.newFlagCount)}`}
                              </span>
                            </p>
                          )}
                          {action.metadata.membersCount !== undefined && (
                            <p>
                              <span className="font-medium">Members:</span>{" "}
                              <span className="text-muted-foreground">
                                {String(action.metadata.membersCount)}
                              </span>
                            </p>
                          )}
                          {action.metadata.fromFlagFlow === true && (
                            <p>
                              <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                                Triggered by flag
                              </span>
                            </p>
                          )}
                          {(() => {
                            const severity = action.metadata.removalSeverity;
                            if (
                              severity &&
                              typeof severity === "string" &&
                              (severity === "hard-remove" ||
                                severity === "warn-review")
                            ) {
                              return (
                                <p>
                                  <span className="font-medium">
                                    Removal Type:
                                  </span>{" "}
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                      severity === "hard-remove"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                    )}
                                  >
                                    {severity === "hard-remove"
                                      ? "Hard Remove"
                                      : "Warn/Review"}
                                  </span>
                                </p>
                              );
                            }
                            return null;
                          })()}
                          {action.metadata.autoFlagged === true && (
                            <p>
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100">
                                ⚠️ Organizer auto-flagged for review
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    {action.admins && (
                      <p className="text-xs text-muted-foreground mt-2">
                        by {action.admins.email}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <ConfirmDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        title="Approve Group"
        description="Are you sure you want to approve this group? It will become active and visible to users."
        confirmText="Approve"
        onConfirm={handleApprove}
      />

      {/* Remove Dialog */}
      <ConfirmDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title="Remove Group"
        description="Are you sure you want to remove this group? This action requires a reason."
        variant="destructive"
        confirmText="Remove Group"
        onConfirm={handleRemove}
        validate={() => removeReason.trim().length > 0}
      >
        <div className="space-y-2">
          <Label htmlFor="remove-reason">Reason (required)</Label>
          <textarea
            id="remove-reason"
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
            placeholder="Enter reason for removing this group..."
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
        </div>
      </ConfirmDialog>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
