"use client";

import React, { useState } from "react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const CONFIRM_TEXT = "DELETE";

export function DangerZoneSection() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();
  const { signOut } = useClerk();

  const canConfirm = confirmInput === CONFIRM_TEXT;

  const handleCloseModal = () => {
    setDeleteModalOpen(false);
    setConfirmInput("");
  };

  const handleConfirmDelete = async () => {
    if (!canConfirm || isDeleting) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/settings/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.error || "Failed to delete account");
        return;
      }

      toast.success("Account deleted successfully.");
      handleCloseModal();

      // After deletion we hard-delete the Clerk user. `signOut()` may fail because
      // the user/session might no longer exist. Always redirect to sign-in.
      try {
        await signOut({ redirectUrl: "/sign-in?reason=deleted" });
      } catch {
        window.location.href = "/sign-in?reason=deleted";
      }
    } catch (err) {
      console.error("Delete account error:", err);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
        <div className="md:space-y-2 space-y-1">
          <h1 className="md:text-lg text-sm font-semibold text-destructive">
            Delete account
          </h1>
          <p className="md:text-sm text-xs text-muted-foreground">
            This action is permanent and cannot be undone.
          </p>
        </div>
        <section
          className={`rounded-2xl border border-destructive/50 bg-destructive/5 ${isMobile ? "p-0 shadow-none" : "p-4 px-6 shadow-none"}`}
        >
          <div
            className={`${isMobile ? "px-4 pt-4 pb-4" : ""} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Permanently remove your account
              </p>
              <p className="text-sm text-muted-foreground">
                Deleting your account removes your profile, groups, and
                activity.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-full md:w-auto rounded-lg px-3 py-1"
              onClick={() => setDeleteModalOpen(true)}
              disabled={isDeleting}
            >
              Delete Account
            </Button>
          </div>
        </section>
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[22rem] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="mb-2 text-left">
              Delete your account?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm text-left">
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
            <Input
              id="delete-confirm"
              type="text"
              placeholder="DELETE"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              aria-invalid={confirmInput.length > 0 && !canConfirm}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!canConfirm || isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
