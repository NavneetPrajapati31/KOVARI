"use client";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { User } from "lucide-react";

interface Traveler {
  id: string;
  name: string;
  email: string;
  location: string;
  avatar?: string;
}

interface InviteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  traveler: Traveler | null;
  onConfirm: (traveler: Traveler) => void;
  isLoading?: boolean;
}

export function InviteConfirmationModal({
  isOpen,
  onClose,
  traveler,
  onConfirm,
  isLoading = false,
}: InviteConfirmationModalProps) {
  if (!traveler) return null;

  const handleConfirm = () => {
    onConfirm(traveler);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Confirm Invitation
          </DialogTitle>
          <DialogDescription className="text-left">
            Are you sure you want to invite{" "}
            <span className="font-semibold text-foreground">
              {traveler.name}
            </span>{" "}
            to join your group?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            {traveler.avatar ? (
              <img
                src={traveler.avatar || "/placeholder.svg"}
                alt={traveler.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{traveler.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {traveler.email}
            </p>
            <p className="text-xs text-muted-foreground">{traveler.location}</p>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Sending..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
