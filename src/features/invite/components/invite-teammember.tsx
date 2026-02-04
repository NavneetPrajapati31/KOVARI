"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { X, Link2, CheckCircle2, Info } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { Divider } from "@heroui/react";

interface InviteTeammatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

const isValidEmail = (input: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());

const isValidUsername = (input: string): boolean =>
  /^[a-zA-Z0-9_]{3,20}$/.test(input.trim());

export function InviteTeammatesModal({
  open,
  onOpenChange,
  groupId,
}: InviteTeammatesModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSentSuccess, setInviteSentSuccess] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{
    type: "already_invited" | "already_member";
    text: string;
  } | null>(null);
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const trimmed = inputValue.trim();
  const canInvite =
    trimmed.length > 0 && (isValidEmail(trimmed) || isValidUsername(trimmed));

  const handleInvite = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!canInvite) {
      toast({
        title: "Invalid input",
        description:
          "Enter a valid email address or username (3–20 characters, letters, numbers, underscores).",
        variant: "destructive",
      });
      return;
    }

    const invites = isValidEmail(trimmed)
      ? [{ email: trimmed }]
      : [{ username: trimmed }];

    setIsInviting(true);
    setInviteSentSuccess(false);
    setInfoMessage(null);
    try {
      const res = await fetch(`/api/group-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, invites }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      const status = data.status as string | undefined;

      if (status === "already_invited") {
        const message =
          data.message ||
          "This user already has a pending invitation to the group.";
        setInfoMessage({ type: "already_invited", text: message });
        toast({
          title: "User already invited",
          description: message,
        });
        return;
      }

      if (status === "already_member") {
        const message =
          data.message || "This user is already a member of the group.";
        setInfoMessage({ type: "already_member", text: message });
        toast({
          title: "User is already a member",
          description: message,
        });
        return;
      }

      setInviteSentSuccess(true);
      setInputValue("");
      toast({
        title: "Invite sent successfully",
        description: isValidEmail(trimmed)
          ? `An email invite was sent to ${trimmed}.`
          : `An invite was sent to ${trimmed}.`,
      });
    } catch (err) {
      toast({
        title: "Failed to invite",
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleGetLink = async () => {
    setIsLinkLoading(true);
    setLinkError("");
    try {
      const res = await fetch(`/api/group-invitation?groupId=${groupId}`);
      if (!res.ok) throw new Error("Failed to fetch link");
      const data = await res.json();
      setInviteLink(data.link);
      await navigator.clipboard.writeText(data.link);
      toast({
        title: "Link copied",
        description: "Invite link has been copied to your clipboard.",
      });
    } catch {
      setLinkError("Failed to fetch invite link.");
      toast({
        title: "Failed to copy",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      });
    } finally {
      setIsLinkLoading(false);
    }
  };

  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        throw new Error("Clipboard not available");
      }
    } catch {
      try {
        const input = linkInputRef.current;
        if (input) {
          input.select();
          input.setSelectionRange(0, inviteLink.length);
          const ok = document.execCommand("copy");
          if (!ok) throw new Error("execCommand failed");
        } else {
          throw new Error("Input not found");
        }
      } catch {
        toast({
          title: "Copy failed",
          description: "Please select and copy the link manually.",
          variant: "destructive",
        });
        return;
      }
    }
    setLinkCopied(true);
    toast({
      title: "Link copied",
      description: "Invite link copied to clipboard.",
    });
    window.setTimeout(() => setLinkCopied(false), 2000);
  }, [inviteLink]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setInviteSentSuccess(false);
      setInfoMessage(null);
      setLinkCopied(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg w-[95vw] sm:w-full p-0 gap-0 bg-card min-w-0 max-h-[90vh] overflow-hidden"
        hideCloseButton
      >
        <DialogTitle />
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <h2 className="text-md font-semibold text-foreground truncate pr-2">
            Invite member
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="p-0 hover:bg-transparent text-foreground hover:text-foreground"
            aria-label="Close invite modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Divider className="mb-4" />

        <div className="px-4 sm:px-6 pb-4 space-y-4 overflow-y-auto flex-1">
          {inviteSentSuccess && (
            <div
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-2 text-sm"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Invite sent successfully.</span>
            </div>
          )}
          {infoMessage && (
            <div
              className="flex items-center gap-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2 text-sm"
              role="alert"
              aria-live="polite"
            >
              <Info className="h-4 w-4 shrink-0" />
              <span>{infoMessage.text}</span>
            </div>
          )}
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleInvite(e);
            }}
            noValidate
          >
            <label
              htmlFor="invite-input"
              className="text-sm font-medium text-foreground sr-only"
            >
              Email or username
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="invite-input"
                type="text"
                autoComplete="off"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setInviteSentSuccess(false);
                  setInfoMessage(null);
                }}
                placeholder="Enter email or username"
                className="flex-1 rounded-lg"
                aria-label="Email or username to invite"
              />
              <Button
                type="button"
                onClick={(e) => handleInvite(e)}
                disabled={!canInvite || isInviting}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm w-full sm:w-auto whitespace-nowrap"
                aria-label="Send invite"
              >
                {isInviting ? "Sending…" : "Invite"}
              </Button>
            </div>
          </form>

          <div className="rounded-2xl py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <Link2 className="h-5 w-5 text-muted-foreground" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    Shareable link
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1">
                    Create and copy a shareable invite link for this group.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLink}
                className="bg-card border-border hover:bg-muted text-muted-foreground px-4 sm:px-5 py-1.5 rounded-lg text-sm whitespace-nowrap shrink-0"
                aria-label="Get invite link"
                disabled={isLinkLoading}
              >
                {isLinkLoading ? "Creating…" : "Get link"}
              </Button>
            </div>
            {inviteLink && (
              <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  ref={linkInputRef}
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 text-xs bg-background rounded-md px-3 py-2 border border-border min-w-0 break-all"
                  aria-label="Invite link"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-xs px-3 py-2 bg-primary text-primary-foreground whitespace-nowrap w-full sm:w-auto h-auto border border-primary"
                  aria-label={linkCopied ? "Copied" : "Copy invite link"}
                >
                  {linkCopied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
            {linkError && (
              <p className="text-xs text-destructive mt-1" role="alert">
                {linkError}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
