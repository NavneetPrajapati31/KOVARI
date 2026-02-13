import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarImage } from "@/shared/components/ui/avatar";
import { UserAvatarFallback } from "@/shared/components/UserAvatarFallback";
import { AlertTriangle } from "lucide-react";

interface RemoveMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    clerkId: string;
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

  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-modal="true"
        aria-labelledby="remove-member-title"
        aria-describedby="remove-member-description"
        className="rounded-2xl border-border max-w-[min(420px,calc(100vw-2rem))]"
      >
        <DialogHeader className="text-left mb-2">
          <DialogTitle
            id="remove-member-title"
            className="text-foreground font-semibold text-left"
          >
            Remove member
          </DialogTitle>
          <DialogDescription
            id="remove-member-description"
            className="text-muted-foreground text-left"
          >
            This will remove them from the group.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.avatar || ""} alt={member.name} />
            <UserAvatarFallback />
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium text-foreground truncate">
              {member.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              @{member.username}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            aria-label="Cancel removal"
            className="h-9 hover:bg-background"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onConfirm}
            disabled={isLoading}
            aria-label="Confirm remove member"
            className="h-9 text-destructive hover:text-destructive hover:bg-background"
          >
            {isLoading ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
