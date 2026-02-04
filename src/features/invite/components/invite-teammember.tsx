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
import { Divider, Spinner } from "@heroui/react";

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
    type: "already_invited" | "already_member" | "user_not_found";
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

      if (status === "user_not_found") {
        const message =
          data.message ||
          "No account found with this username. Please check the username and try again.";
        setInfoMessage({
          type: "user_not_found",
          text: message,
        });
        toast({
          title: "Username not found",
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
        className="max-w-lg w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 bg-card min-w-0 max-h-[90dvh] sm:max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-lg"
        hideCloseButton
      >
        <DialogTitle />
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 shrink-0">
          <h2 className="text-base font-semibold text-foreground truncate pr-2">
            Invite member
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-9 w-9 shrink-0 rounded-full p-0 hover:bg-muted/80 text-foreground hover:text-foreground"
            aria-label="Close invite modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Divider className="mb-0 sm:mb-2" />

        <div className="px-4 sm:px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          {inviteSentSuccess && (
            <div
              className="flex items-center gap-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-3 text-sm"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Invite sent successfully.</span>
            </div>
          )}
          {infoMessage && (
            <div
              className="flex items-center gap-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2.5 text-sm"
              role="alert"
              aria-live="polite"
            >
              <Info className="h-4 w-4 shrink-0" />
              <span>{infoMessage.text}</span>
            </div>
          )}
          <form
            className=""
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
                placeholder="Email or username"
                className="flex-1 rounded-xl min-h-11 text-sm"
                aria-label="Email or username to invite"
              />
              <Button
                type="button"
                onClick={(e) => handleInvite(e)}
                disabled={!canInvite || isInviting}
                className="bg-primary text-primary-foreground rounded-xl text-sm font-medium min-h-11 w-full sm:w-auto sm:min-w-[6rem] whitespace-nowrap"
                aria-label="Send invite"
              >
                {isInviting ? (
                  <Spinner
                    variant="spinner"
                    size="sm"
                    classNames={{ spinnerBars: "bg-primary-foreground" }}
                  />
                ) : (
                  "Invite"
                )}
              </Button>
            </div>
          </form>

          <div className="rounded-xl sm:rounded-2xl border border-border bg-muted/30 p-4 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="min-w-0">
                  <h3 className="font-medium text-sm text-foreground">
                    Shareable link
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed sm:line-clamp-1">
                    Share a link so anyone can join this group.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetLink}
                  className="flex-1 sm:flex-initial min-h-11 sm:min-h-0 rounded-lg bg-background border-border hover:bg-muted text-foreground font-medium shrink-0 px-4 text-sm"
                  aria-label="Get invite link"
                  disabled={isLinkLoading}
                >
                  {isLinkLoading ? "Creating…" : "Get link"}
                </Button>
                {inviteLink && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-initial min-h-11 sm:min-h-0 rounded-lg bg-primary text-primary-foreground font-medium shrink-0 px-4 text-sm"
                    aria-label={linkCopied ? "Copied" : "Copy invite link"}
                  >
                    {linkCopied ? "Copied" : "Copy"}
                  </Button>
                )}
              </div>
            </div>
            {linkError && (
              <p className="text-xs text-destructive mt-2" role="alert">
                {linkError}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
