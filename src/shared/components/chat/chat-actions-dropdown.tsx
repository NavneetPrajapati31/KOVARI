import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import { Spinner } from "@heroui/react";
import { useToast } from "@/shared/hooks/use-toast";
import { isUserBlocked, blockUser } from "@/shared/utils/blocked-users";

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
}) => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [hasBlocked, setHasBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const handleMenuOpenChange = (open: boolean) => {
    // Prevent closing while blocking
    if (isBlocking) return;
    setMenuOpen(open);
  };

  return (
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
  );
};

export default ChatActionsDropdown;
