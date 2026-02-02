"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { LogOut, Trash2 } from "lucide-react";
import { useAuthStore } from "@/shared/stores/useAuthStore";

interface MembershipInfo {
  isCreator: boolean;
  isMember: boolean;
  isAdmin: boolean;
  membership: any;
}

export default function DangerPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const groupId = params.groupId as string;

  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Leave group state
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // Delete group state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    if (!groupId) return;

    const fetchMembershipInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/groups/${groupId}/membership`);
        if (!res.ok) {
          throw new Error("Failed to fetch membership info");
        }
        const data = await res.json();
        setMembershipInfo(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembershipInfo();
  }, [groupId]);

  const handleLeaveGroup = async () => {
    if (!groupId) return;

    setIsLeaving(true);
    setLeaveError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        let errorMessage = "Failed to leave group";
        try {
          const data = await res.json();
          errorMessage = data.error || data.message || errorMessage;
        } catch {
          // fallback to default error message
        }
        throw new Error(errorMessage);
      }

      // Redirect to groups page after leaving
      router.push("/groups");
    } catch (err: unknown) {
      setLeaveError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId || deleteConfirmation !== "DELETE") return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        let errorMessage = "Failed to delete group";
        try {
          const data = await res.json();
          errorMessage = data.error || data.message || errorMessage;
        } catch {
          // fallback to default error message
        }
        throw new Error(errorMessage);
      }

      // Redirect to groups page after deleting
      router.push("/groups");
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-4 text-left">
        <div className="space-y-1 mb-8 text-left">
          <h1 className="text-md font-semibold text-foreground">Danger Zone</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Irreversible actions for this group.
          </p>
        </div>
        <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-3 w-72 bg-muted/70 animate-pulse rounded" />
            </div>
            <div className="h-8 w-28 bg-muted animate-pulse rounded shrink-0" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-3 w-72 bg-muted/70 animate-pulse rounded" />
            </div>
            <div className="h-8 w-28 bg-muted animate-pulse rounded shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!membershipInfo?.isMember) {
    return (
      <div className="w-full p-4">
        <p className="text-sm text-muted-foreground">
          You are not a member of this group.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 text-left">
      <div className="space-y-1 mb-8 text-left">
        <h1 className="text-md font-semibold text-foreground">Danger Zone</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Irreversible actions for this group.
        </p>
      </div>

      <div className="space-y-0 border border-border rounded-lg overflow-hidden divide-y divide-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 bg-background text-left">
          <div className="space-y-0.5 min-w-0 text-left">
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              <LogOut className="h-4 w-4 text-muted-foreground shrink-0" />
              Leave Group
            </h2>
            <p className="text-xs text-muted-foreground">
              Leave this group. You can rejoin if you have an invitation.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive bg-card hover:text-destructive hover:bg-destructive/10 border-border shrink-0"
            onClick={() => setIsLeaveDialogOpen(true)}
            disabled={isLeaving}
          >
            {isLeaving ? "Leaving..." : "Leave Group"}
          </Button>
        </div>

        {membershipInfo.isCreator && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 bg-background text-left">
            <div className="space-y-0.5 min-w-0 text-left">
              <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-muted-foreground shrink-0" />
                Delete Group
              </h2>
              <p className="text-xs text-muted-foreground">
                Permanently delete this group and all its data. Cannot be
                undone.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive bg-card hover:text-destructive hover:bg-destructive/10 border-destructive/50 shrink-0"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Group"}
            </Button>
          </div>
        )}
      </div>

      {/* Leave Group Confirmation Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="rounded-2xl border-border max-w-[min(400px,calc(100vw-2rem))]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-foreground font-semibold text-left mb-2">
              Leave Group
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-left">
              Are you sure you want to leave this group? You can rejoin if you
              have an invitation.
            </DialogDescription>
          </DialogHeader>
          {leaveError && (
            <p className="text-sm text-destructive">{leaveError}</p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeaveDialogOpen(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-border"
              onClick={handleLeaveGroup}
              disabled={isLeaving}
            >
              {isLeaving ? "Leaving..." : "Leave Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-2xl border-border max-w-[min(400px,calc(100vw-2rem))]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-foreground font-semibold text-left mb-2">
              Delete Group
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-left">
              This action cannot be undone. This will permanently delete the
              group and all its data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-left">
            <p className="text-sm text-muted-foreground">
              Type{" "}
              <span className="font-mono font-medium text-foreground">
                DELETE
              </span>{" "}
              to confirm:
            </p>
            <Input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="h-9 border-border focus-visible:ring-0"
            />
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteConfirmation("");
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteGroup}
              disabled={isDeleting || deleteConfirmation !== "DELETE"}
            >
              {isDeleting ? "Deleting..." : "Delete Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
