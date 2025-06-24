import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";

interface RemoveMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    name: string;
    avatar: string;
    username: string;
  } | null;
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  open,
  onOpenChange,
  member,
  onConfirm,
  isLoading = false,
  error = null,
}) => {
  if (!member) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-modal="true" aria-labelledby="remove-member-title">
        <DialogHeader>
          <DialogTitle id="remove-member-title">Remove Member</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 py-2">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={member.avatar || "/placeholder.svg"}
              alt={member.name}
            />
            <AvatarFallback>
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-foreground">{member.name}</div>
            <div className="text-xs text-muted-foreground">
              @{member.username}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground py-2">
          Are you sure you want to remove this member from the group? This
          action cannot be undone.
        </p>
        {error && <div className="text-destructive text-xs py-1">{error}</div>}
        <DialogFooter className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            aria-label="Cancel removal"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            aria-label="Confirm remove member"
          >
            {isLoading ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
