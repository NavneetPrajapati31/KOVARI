"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Link2 } from "lucide-react";
import { UserTagInput } from "./user-tag-input";
import { TeammateRow } from "./teammate-row";
import { toast } from "@/hooks/use-toast";
import { Divider } from "@heroui/react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Teammate extends User {
  status: "online" | "away" | "inactive";
  statusDetail?: string;
}

interface InviteTeammatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

const mockTeammates: Teammate[] = [
  {
    id: "1",
    name: "Arlo Finch",
    email: "arlofinch@company.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "online",
  },
  {
    id: "2",
    name: "Juniper Lane",
    email: "juniperlane@company.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "away",
    statusDetail: "2 mins",
  },
  {
    id: "3",
    name: "Rowan Sage",
    email: "rowansage@company.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "away",
    statusDetail: "2 days",
  },
  {
    id: "4",
    name: "Finnian York",
    email: "finnianyork@company.com",
    avatar: "/placeholder.svg?height=40&width=40",
    status: "inactive",
    statusDetail: "1 year",
  },
];

const availableUsers: User[] = [
  {
    id: "5",
    name: "Richard Winson",
    email: "richard.winson@company.com",
  },
  { id: "6", name: "Tedd Morrison", email: "tedd.morrison@company.com" },
  { id: "7", name: "Alex Morgan", email: "alex.morgan@company.com" },
  { id: "8", name: "Jordan Lee", email: "jordan.lee@company.com" },
];

export function InviteTeammatesModal({
  open,
  onOpenChange,
  groupId,
}: InviteTeammatesModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string>("");

  // Helper to validate email
  const isValidEmail = (input: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };

  // Helper to validate username (simple: alphanumeric, 3-20 chars)
  const isValidUsername = (input: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(input);
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to invite.",
        variant: "destructive",
      });
      return;
    }

    // Prepare invites array
    const invites = selectedUsers
      .map((user) => {
        if (isValidEmail(user.email)) {
          return { email: user.email };
        } else if (isValidUsername(user.name)) {
          return { username: user.name };
        }
        return null;
      })
      .filter(Boolean);

    if (invites.length === 0) {
      toast({
        title: "Invalid input",
        description: "Please enter valid emails or usernames.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch(`/api/group-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, invites }),
      });
      if (!res.ok) throw new Error("Failed to send invites");
      toast({
        title: "Invitations sent!",
        description: `Successfully sent invitations to ${invites.length} user${
          invites.length > 1 ? "s" : ""
        }.`,
      });
      setSelectedUsers([]);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Failed to invite",
        description: "An error occurred while sending invites.",
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
        title: "Link copied!",
        description: "Invite link has been copied to your clipboard.",
      });
    } catch (err) {
      setLinkError("Failed to fetch invite link.");
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    } finally {
      setIsLinkLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 gap-0 bg-card min-w-0"
        hideCloseButton
      >
        <DialogTitle></DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <h2 className="text-md font-semibold text-foreground">
            Invite Teammates
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

        <div className="px-6 pb-4 space-y-4">
          {/* Tag Input with Invite Button */}
          <div className="flex items-center gap-1">
            <div className="flex-1 min-w-0">
              <UserTagInput
                availableUsers={availableUsers}
                selectedUsers={selectedUsers}
                onSelectionChange={setSelectedUsers}
                placeholder="Enter email or username..."
                allowCustomInput
              />
            </div>
            <Button
              size={"lg"}
              onClick={handleInvite}
              disabled={selectedUsers.length === 0 || isInviting}
              className="bg-foreground text-primary-foreground px-6 py-2 rounded-full text-sm"
              aria-label="Invite selected users"
            >
              {isInviting ? "Inviting..." : "Invite"}
            </Button>
          </div>

          {/* Shareable Link Section */}
          <div className="bg-gray-100 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Link2 className="h-5 w-5 text-muted-foreground" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-foreground">
                    Shareable Link is now Live!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Create and get shareable link for this group.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetLink}
                className="bg-card border-border hover:bg-gray-200 text-muted-foreground px-5 py-1.5 rounded-lg text-sm"
                aria-label="Get invite link"
                disabled={isLinkLoading}
              >
                {isLinkLoading ? "Creating..." : "Get Link"}
              </Button>
            </div>
            {inviteLink && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="w-full text-xs bg-transparent rounded px-3 py-2 border border-gray-200"
                  aria-label="Invite link"
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteLink);
                    toast({
                      title: "Link copied!",
                      description: "Invite link copied to clipboard.",
                    });
                  }}
                  className="text-xs px-3 py-1 bg-primary"
                  aria-label="Copy invite link"
                >
                  Copy
                </Button>
              </div>
            )}
            {linkError && (
              <div className="text-xs text-red-500 mt-1">{linkError}</div>
            )}
          </div>
        </div>

        {/* Team Members List
        <div className="px-6 pb-6 pt-2">
          <div className="space-y-1">
            {mockTeammates.map((teammate) => (
              <TeammateRow key={teammate.id} teammate={teammate} />
            ))}
          </div>
        </div> */}
      </DialogContent>
    </Dialog>
  );
}
