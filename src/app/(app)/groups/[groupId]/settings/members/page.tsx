import React, { useState, useEffect } from "react";
import { InviteTeammatesModal } from "@/components/modals/member-invitation/invite-teammember";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { Chip } from "@heroui/react";
import { RemoveMemberModal } from "@/components/modals/member-invitation/remove-member-modal";
import { useAuthStore } from "@/stores/useAuthStore";

interface GroupMember {
  id: string;
  clerkId: string;
  name: string;
  username: string;
  role: "admin" | "member";
  dateAdded: string;
  avatar: string;
}

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Skeleton for desktop table view
const MembersTableSkeleton = () => (
  <div className="hidden lg:block">
    <div className="bg-card rounded-3xl border border-border animate-pulse">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 rounded-t-3xl border-b border-border bg-gray-100">
        <div className="col-span-3 text-xs font-medium text-foreground">
          Name
        </div>
        <div className="col-span-2 text-xs font-medium text-foreground">
          Username
        </div>
        <div className="col-span-2 text-xs font-medium text-foreground">
          Role
        </div>
        <div className="col-span-3 text-xs font-medium text-foreground">
          Date added
        </div>
        <div className="col-span-2 text-xs font-medium text-foreground"></div>
      </div>
      {/* Skeleton Rows */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-b-0"
        >
          <div className="col-span-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
          <div className="col-span-2 flex items-center">
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
          <div className="col-span-2 flex items-center">
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
          <div className="col-span-3 flex items-center">
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
          {/* <div className="col-span-2 flex items-center justify-end gap-2">
            <div className="h-6 w-16 bg-muted rounded" />
          </div> */}
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for mobile card view
const MembersCardSkeleton = () => (
  <div className="lg:hidden space-y-4 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="bg-card rounded-lg border border-border p-4 space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
          {/* <div className="h-5 w-14 bg-muted rounded" /> */}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border gap-2">
          <div className="h-3 w-1/2 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      </div>
    ))}
  </div>
);

export default function page() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(
    null
  );
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const currentUserMembership =
    !isLoading && user
      ? members.find((m) => m.clerkId === currentUserId)
      : undefined;
  const isCurrentUserAdmin = currentUserMembership?.role === "admin";

  // Ensure admins appear at the top
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    return 0;
  });

  const handleOpenInviteModal = () => setIsInviteModalOpen(true);
  const handleCloseInviteModal = () => setIsInviteModalOpen(false);

  const handleOpenRemoveModal = (member: GroupMember) => {
    setSelectedMember(member);
    setRemoveError(null);
    setIsRemoveModalOpen(true);
  };
  const handleCloseRemoveModal = () => {
    setIsRemoveModalOpen(false);
    setSelectedMember(null);
    setRemoveError(null);
  };

  const handleConfirmRemove = async () => {
    if (!selectedMember) return;
    if (selectedMember.clerkId === currentUserId) {
      setRemoveError("You cannot remove yourself from the group.");
      return;
    }
    setIsRemoving(true);
    setRemoveError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          memberClerkId: selectedMember.clerkId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }
      setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      handleCloseRemoveModal();
    } catch (err: unknown) {
      setRemoveError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsRemoving(false);
    }
  };

  useEffect(() => {
    if (!groupId) return;
    const fetchMembers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/groups/${groupId}/members`);
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setMembers(data.members || []);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, [groupId]);

  // Debug log to help diagnose Remove button visibility
  console.log({ user, members, currentUserId, currentUserMembership });

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-md sm:text-lg font-bold text-foreground">
            Members
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
            Manage your group's members. Invite new people and remove members as
            needed. Group admins can control who participates and help keep your
            group organized and secure.
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 self-start"
          onClick={handleOpenInviteModal}
          aria-label="Invite member"
          tabIndex={0}
        >
          <span>Invite member</span>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="w-full flex justify-center py-10">
          <span className="text-destructive">{error}</span>
        </div>
      )}

      {/* Skeletons while loading */}
      {isLoading && !error && (
        <>
          <MembersTableSkeleton />
          <MembersCardSkeleton />
        </>
      )}

      {/* Desktop Table View */}
      {!isLoading && !error && (
        <div className="hidden lg:block">
          <div className="bg-card rounded-3xl border border-border">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 rounded-t-3xl border-b border-border bg-gray-100">
              <div className="col-span-3 text-xs font-medium text-foreground">
                Name
              </div>
              <div className="col-span-2 text-xs font-medium text-foreground">
                Username
              </div>
              <div className="col-span-2 text-xs font-medium text-foreground">
                Role
              </div>
              <div className="col-span-3 text-xs font-medium text-foreground">
                Date added
              </div>
              <div className="col-span-2 text-xs font-medium text-foreground"></div>
            </div>

            {/* Table Rows */}
            {sortedMembers.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-gray-50"
              >
                <div className="col-span-3 flex items-center gap-3">
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
                  <span className="font-medium text-foreground text-sm">
                    {member.name}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-muted-foreground text-sm">
                    {member.username}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  {member.role === "admin" ? (
                    <Chip
                      size="sm"
                      variant="bordered"
                      className="text-sm capitalize flex-shrink-0 self-center bg-primary-light border-1 border-primary text-primary px-2"
                    >
                      <span className="font-medium text-xs">Admin</span>
                    </Chip>
                  ) : (
                    <Chip
                      size="sm"
                      variant="bordered"
                      className="text-sm capitalize flex-shrink-0 self-center bg-gray-200 border-1 border-muted-foreground text-muted-foreground px-2"
                    >
                      <span className="font-medium text-xs">Member</span>
                    </Chip>
                  )}
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="text-muted-foreground text-sm">
                    {formatDate(member.dateAdded)}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {!isLoading &&
                    isCurrentUserAdmin &&
                    member.role !== "admin" &&
                    member.clerkId !== currentUserId && (
                      <Button
                        variant="ghost"
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 px-3 py-1 h-auto text-xs"
                        onClick={() => handleOpenRemoveModal(member)}
                        aria-label={`Remove ${member.name}`}
                        tabIndex={0}
                      >
                        Remove
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile/Tablet Card View */}
      {!isLoading && !error && (
        <div className="lg:hidden space-y-4">
          {sortedMembers.map((member) => (
            <div
              key={member.id}
              className="bg-card rounded-lg border border-border p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
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
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate text-sm">
                    {member.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {member.username}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "admin" ? (
                    <Chip
                      size="sm"
                      variant="bordered"
                      className="text-sm capitalize flex-shrink-0 self-center bg-primary-light border-1 border-primary text-primary px-2"
                    >
                      <span className="font-medium text-xs">Admin</span>
                    </Chip>
                  ) : (
                    <Chip
                      size="sm"
                      variant="bordered"
                      className="text-sm capitalize flex-shrink-0 self-center bg-gray-200 border-1 border-muted-foreground text-muted-foreground px-2"
                    >
                      <span className="font-medium text-xs">Member</span>
                    </Chip>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Added {formatDate(member.dateAdded)}
                </div>
                {!isLoading &&
                  isCurrentUserAdmin &&
                  member.role !== "admin" &&
                  member.clerkId !== currentUserId && (
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 px-3 py-1 h-auto text-xs"
                      onClick={() => handleOpenRemoveModal(member)}
                      aria-label={`Remove ${member.name}`}
                      tabIndex={0}
                    >
                      Remove
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      <InviteTeammatesModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        groupId={groupId}
      />
      <RemoveMemberModal
        open={isRemoveModalOpen}
        onOpenChange={setIsRemoveModalOpen}
        member={selectedMember}
        onConfirm={handleConfirmRemove}
        isLoading={isRemoving}
        error={removeError}
      />
    </div>
  );
}
