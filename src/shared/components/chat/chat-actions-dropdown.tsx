import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/components/ui/dropdown-menu";
import { EllipsisVertical, Flag } from "lucide-react";
import { Spinner } from "@heroui/react";
import { useToast } from "@/shared/hooks/use-toast";
import { isUserBlocked, blockUser } from "@/shared/utils/blocked-users";
import { ReportDialog } from "@/shared/components/ReportDialog";

interface PartnerProfile {
  name?: string;
  username?: string;
  profile_photo?: string;
}

interface ChatActionsDropdownProps {
  currentUserUuid: string;
  partnerUuid: string;
  disabled?: boolean;
  onBlocked?: () => void;
  partnerProfile?: PartnerProfile;
}

const ChatActionsDropdown: React.FC<ChatActionsDropdownProps> = ({
  currentUserUuid,
  partnerUuid,
  disabled,
  onBlocked,
  partnerProfile,
}) => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [hasBlocked, setHasBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { toast } = useToast();

  // Check if already blocked on mount
  useEffect(() => {
    const checkBlocked = async () => {
      if (!currentUserUuid || !partnerUuid) return;
      try {
        const blocked = await isUserBlocked(currentUserUuid, partnerUuid);
        setHasBlocked(blocked);
      } catch (err) {
        setBlockError("Failed to check block status");
      }
    };
    checkBlocked();
  }, [currentUserUuid, partnerUuid]);

  const handleBlockUser = async () => {
    setIsBlocking(true);
    setMenuOpen(true); // keep menu open
    setBlockError(null);
    try {
      await blockUser(currentUserUuid, partnerUuid);
      setHasBlocked(true);
      toast({
        title: "User blocked",
        description: "You have blocked this user.",
        variant: "default",
      });
      if (onBlocked) onBlocked();
      window.location.reload();
    } catch (err: any) {
      setBlockError("Failed to block user");
      toast({
        title: "Block failed",
        description: err?.message || "Failed to block user.",
        variant: "destructive",
      });
    } finally {
      setIsBlocking(false);
      setMenuOpen(false); // close after blocking done
    }
  };

  const handleReportSubmit = async (
    reason: string,
    evidenceUrl: string | null,
    evidencePublicId: string | null,
    additionalNotes: string
  ) => {
    try {
      // Combine reason and additional notes
      const fullReason = additionalNotes
        ? `${reason}\n\nAdditional notes: ${additionalNotes}`
        : reason;

      const response = await fetch("/api/matching/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reporterId: currentUserUuid,
          targetId: partnerUuid,
          reason: fullReason,
          type: "user",
          evidenceUrl,
          evidencePublicId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      toast({
        title: "Report submitted",
        description: "Thank you not reporting. The user will be blocked automatically.",
        variant: "default",
      });

      // Automatically block the user after reporting
      await handleBlockUser();
      
      return true;
    } catch (error: any) {
      console.error("Report error:", error);
      toast({
        title: "Report failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleMenuOpenChange = (open: boolean) => {
    // Prevent closing while blocking
    if (isBlocking) return;
    setMenuOpen(open);
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            className="p-2 rounded-full bg-transparent focus:outline-none focus:ring-0 hover:cursor-pointer"
            aria-label="Chat actions"
            tabIndex={0}
            disabled={disabled}
            onClick={() => setMenuOpen(true)}
          >
            <EllipsisVertical className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-4 py-2 min-w-[160px] rounded-2xl shadow-sm backdrop-blur-2xl bg-white/70 transition-all duration-300 ease-in-out border-border mr-4">
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false);
              setReportOpen(true);
            }}
            disabled={disabled || hasBlocked}
            className="text-foreground font-medium hover:cursor-pointer focus:bg-transparent focus:text-foreground focus-within:!border-none focus-within:!outline-none"
          >
            <span className="flex items-center gap-2">
              {/* <Flag className="h-4 w-4" /> */}
              Report User
            </span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            onClick={handleBlockUser}
            disabled={isBlocking || hasBlocked || disabled}
            className="text-destructive font-semibold focus:bg-destructive/10 focus:text-destructive hover:cursor-pointer focus-within:!border-none focus-within:!outline-none"
            aria-label={hasBlocked ? "User already blocked" : "Block user"}
          >
            {isBlocking ? (
              <span className="flex items-center gap-2">
                <Spinner variant="spinner" size="sm" color="danger" />
                Blocking...
              </span>
            ) : hasBlocked ? (
              "User Blocked"
            ) : (
              "Block User"
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="user"
        targetId={partnerUuid}
        targetName={partnerProfile?.name || "User"}
        onSubmit={handleReportSubmit}
      />
    </>
  );
};

export default ChatActionsDropdown;
