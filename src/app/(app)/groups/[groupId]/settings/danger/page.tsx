"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
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
      <div className="w-full mx-auto p-4 space-y-4">
        <div className="animate-pulse mt-2">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto p-4">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!membershipInfo?.isMember) {
    return (
      <div className="w-full mx-auto p-4">
        <div className="text-center text-muted-foreground">
          <p>You are not a member of this group.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-md sm:text-lg font-bold text-foreground">
            Danger Zone
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Irreversible and destructive actions for this group.
          </p>
        </div>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex text-sm items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Leave Group
          </CardTitle>
          <CardDescription className="text-sm">
            Leave this group. You can rejoin if you have an invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="text-sm"
            onClick={() => setIsLeaveDialogOpen(true)}
            disabled={isLeaving}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLeaving ? "Leaving..." : "Leave Group"}
          </Button>
        </CardContent>
      </Card>

      {membershipInfo.isCreator && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-sm gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Group
            </CardTitle>
            <CardDescription className="text-sm">
              Permanently delete this group and all its data. This action cannot
              be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="text-sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete Group"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Leave Group Confirmation Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Leave Group
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this group? You can rejoin if you
              have an invitation.
            </DialogDescription>
          </DialogHeader>
          {leaveError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {leaveError}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLeaveDialogOpen(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Group
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              group and all its data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              To confirm deletion, type{" "}
              <span className="font-mono font-bold">DELETE</span> in the field
              below:
            </div>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {deleteError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {deleteError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
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
