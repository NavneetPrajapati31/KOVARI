"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ConfirmDialog } from "./ConfirmDialog";
import { ToastContainer, useToast } from "./Toast";
import { cn } from "../lib/utils";

interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  email: string;
  age: number;
  gender: string;
  nationality: string;
  bio?: string;
  languages?: string[];
  profile_photo?: string;
  verified: boolean;
  deleted?: boolean;
  smoking?: string;
  drinking?: string;
  religion?: string;
  personality?: string;
  interests?: string[];
  users?: {
    banned: boolean;
    ban_reason?: string;
    ban_expires_at?: string;
  };
}

interface Flag {
  id: string;
  type: string;
  reason: string;
  status: string;
  created_at: string;
}

interface AdminNote {
  id: string;
  reason: string;
  created_at: string;
  admins?: {
    email: string;
  };
}

interface UserDetailProps {
  profile: UserProfile;
  flags: Flag[];
  sessions: Array<{ key: string; data: unknown }>;
  notes: AdminNote[];
}

export function UserDetail({
  profile: initialProfile,
  flags: initialFlags,
  sessions: initialSessions,
  notes: initialNotes,
}: UserDetailProps) {
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();
  const [profile, setProfile] = React.useState(initialProfile);
  const [flags, setFlags] = React.useState(initialFlags);
  const [notes, setNotes] = React.useState(initialNotes);
  const [isLoading, setIsLoading] = React.useState(false);
  const expectedStateRef = React.useRef<{
    banned?: boolean;
    ban_expires_at?: string | undefined;
  } | null>(null);

  // Update profile when initialProfile changes (after router.refresh())
  // Only update if server data matches our expected state or if we haven't done an optimistic update
  React.useEffect(() => {
    if (expectedStateRef.current) {
      // We did an optimistic update - check if server confirms it
      const serverBanned = initialProfile.users?.banned;
      const serverBanExpires = initialProfile.users?.ban_expires_at;
      const expected = expectedStateRef.current;

      // If server data matches what we expect, server has caught up - sync it
      if (
        serverBanned === expected.banned &&
        serverBanExpires === expected.ban_expires_at
      ) {
        expectedStateRef.current = null;
        setProfile(initialProfile);
      }
      // Otherwise, keep our optimistic state and don't overwrite
    } else {
      // No optimistic update pending, safe to sync with server
      setProfile(initialProfile);
    }
  }, [initialProfile]);
  const [actionState, setActionState] = React.useState<{
    type: "suspend" | "ban" | null;
    open: boolean;
  }>({ type: null, open: false });
  const [suspendForm, setSuspendForm] = React.useState({
    reason: "",
    banUntil: "",
  });
  const [banForm, setBanForm] = React.useState({ reason: "" });
  const [noteForm, setNoteForm] = React.useState({ note: "" });
  const [showNoteForm, setShowNoteForm] = React.useState(false);

  const handleAction = async (
    action: "verify" | "ban" | "suspend" | "unban",
    reason?: string,
    banUntil?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, banUntil }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Action failed");
      }

      // Optimistically update the profile state
      if (action === "ban" || action === "suspend") {
        const banExpiresAt = action === "suspend" ? banUntil : undefined;
        expectedStateRef.current = {
          banned: true,
          ban_expires_at: banExpiresAt,
        };
        setProfile((prev) => ({
          ...prev,
          users: {
            banned: true,
            ban_reason: reason || `Admin ${action}`,
            ban_expires_at: banExpiresAt,
          },
        }));
      } else if (action === "unban") {
        expectedStateRef.current = {
          banned: false,
          ban_expires_at: undefined,
        };
        setProfile((prev) => ({
          ...prev,
          users: {
            banned: false,
            ban_reason: undefined,
            ban_expires_at: undefined,
          },
        }));
      } else if (action === "verify") {
        setProfile((prev) => ({
          ...prev,
          verified: true,
        }));
      }

      toast({
        title: "Success",
        description: `User ${action}ed successfully`,
        variant: "success",
      });

      // Refresh after a short delay to allow server to process
      setTimeout(() => {
        router.refresh();
      }, 300);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Action failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setActionState({ type: null, open: false });
      setSuspendForm({ reason: "", banUntil: "" });
      setBanForm({ reason: "" });
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.note.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteForm.note }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add note");
      }

      toast({
        title: "Success",
        description: "Note added successfully",
        variant: "success",
      });

      // Refresh notes
      const notesRes = await fetch(`/api/admin/users/${profile.id}/notes`);
      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data.notes || []);
      }

      setNoteForm({ note: "" });
      setShowNoteForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check ban status - handle both boolean true and truthy values
  const isBanned = profile.users?.banned === true;
  const isSuspended = isBanned && !!profile.users?.ban_expires_at;
  const isPermanentlyBanned = isBanned && !profile.users?.ban_expires_at;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-6">
          <div
            className={cn(
              "h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden",
              profile.deleted && "opacity-50"
            )}
          >
            {profile.profile_photo ? (
              <img
                src={profile.profile_photo}
                alt={profile.name || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-medium">
                {profile.name?.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold">
                {profile.name || "Unknown User"}
              </h1>
              {profile.verified && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                  Verified
                </span>
              )}
              {isBanned && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100">
                  {isSuspended ? "Suspended" : "Banned"}
                </span>
              )}
              {profile.deleted && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-100">
                  Deleted
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-sm text-muted-foreground">
              {profile.age} • {profile.gender} • {profile.nationality}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!profile.verified && (
            <Button
              variant="outline"
              onClick={() => handleAction("verify")}
              disabled={isLoading}
            >
              Verify
            </Button>
          )}
          {!isBanned && (
            <>
              <Button
                variant="outline"
                onClick={() => setActionState({ type: "suspend", open: true })}
                disabled={isLoading}
              >
                Suspend
              </Button>
              <Button
                variant="destructive"
                onClick={() => setActionState({ type: "ban", open: true })}
                disabled={isLoading}
              >
                Ban
              </Button>
            </>
          )}
          {isSuspended && (
            <Button
              variant="outline"
              onClick={() => handleAction("unban")}
              disabled={isLoading}
            >
              Revoke Suspension
            </Button>
          )}
          {isPermanentlyBanned && (
            <Button
              variant="outline"
              onClick={() => handleAction("unban")}
              disabled={isLoading}
            >
              Unban
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowNoteForm(!showNoteForm)}
          >
            {showNoteForm ? "Cancel Note" : "Add Note"}
          </Button>
        </div>

        {/* Add Note Form */}
        {showNoteForm && (
          <div className="rounded-md border p-4 space-y-4">
            <Label htmlFor="note">Admin Note</Label>
            <textarea
              id="note"
              value={noteForm.note}
              onChange={(e) => setNoteForm({ note: e.target.value })}
              placeholder="Enter admin note..."
              className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNoteForm(false);
                  setNoteForm({ note: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNote}
                disabled={!noteForm.note.trim() || isLoading}
              >
                Add Note
              </Button>
            </div>
          </div>
        )}

        {/* Admin Notes */}
        {notes.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Admin Notes</h2>
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm">{note.reason}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {note.admins?.email} •{" "}
                    {new Date(note.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flags */}
        {flags.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Flags ({flags.length})</h2>
            <div className="space-y-2">
              {flags.map((flag) => (
                <div key={flag.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="font-medium text-sm">{flag.type}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {flag.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.reason}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(flag.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sessions */}
        {initialSessions.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Active Sessions</h2>
            <div className="space-y-2">
              {initialSessions.map((session, idx) => (
                <div key={idx} className="rounded-md border p-3">
                  <div className="text-sm font-mono break-all">
                    {session.key}
                  </div>
                  <pre className="text-xs text-muted-foreground mt-2 overflow-auto">
                    {JSON.stringify(session.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Details */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Profile Details</h2>
          <div className="rounded-md border p-4 space-y-2">
            {profile.bio && (
              <div>
                <span className="text-sm font-medium">Bio: </span>
                <span className="text-sm">{profile.bio}</span>
              </div>
            )}
            {profile.languages && profile.languages.length > 0 && (
              <div>
                <span className="text-sm font-medium">Languages: </span>
                <span className="text-sm">{profile.languages.join(", ")}</span>
              </div>
            )}
            {profile.smoking && (
              <div>
                <span className="text-sm font-medium">Smoking: </span>
                <span className="text-sm">{profile.smoking}</span>
              </div>
            )}
            {profile.drinking && (
              <div>
                <span className="text-sm font-medium">Drinking: </span>
                <span className="text-sm">{profile.drinking}</span>
              </div>
            )}
            {profile.religion && (
              <div>
                <span className="text-sm font-medium">Religion: </span>
                <span className="text-sm">{profile.religion}</span>
              </div>
            )}
            {profile.personality && (
              <div>
                <span className="text-sm font-medium">Personality: </span>
                <span className="text-sm">{profile.personality}</span>
              </div>
            )}
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <span className="text-sm font-medium">Interests: </span>
                <span className="text-sm">{profile.interests.join(", ")}</span>
              </div>
            )}
            {isBanned && profile.users?.ban_reason && (
              <div>
                <span className="text-sm font-medium">Ban Reason: </span>
                <span className="text-sm text-destructive">
                  {profile.users.ban_reason}
                </span>
              </div>
            )}
            {isSuspended && profile.users?.ban_expires_at && (
              <div>
                <span className="text-sm font-medium">
                  Suspension Expires:{" "}
                </span>
                <span className="text-sm">
                  {new Date(profile.users.ban_expires_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suspend Dialog */}
      {actionState.type === "suspend" && (
        <ConfirmDialog
          open={actionState.open}
          onOpenChange={(open) =>
            setActionState({ type: open ? "suspend" : null, open })
          }
          title="Suspend User"
          description="Temporarily suspend this user. They will be unable to access the platform until the suspension expires."
          confirmText="Suspend"
          variant="destructive"
          validate={() => !!suspendForm.reason.trim() && !!suspendForm.banUntil}
          onConfirm={() =>
            handleAction("suspend", suspendForm.reason, suspendForm.banUntil)
          }
        >
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="suspend-reason">Reason</Label>
              <Input
                id="suspend-reason"
                value={suspendForm.reason}
                onChange={(e) =>
                  setSuspendForm({ ...suspendForm, reason: e.target.value })
                }
                placeholder="Reason for suspension"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="suspend-until">Suspension Expires</Label>
              <Input
                id="suspend-until"
                type="datetime-local"
                value={suspendForm.banUntil}
                onChange={(e) =>
                  setSuspendForm({ ...suspendForm, banUntil: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
        </ConfirmDialog>
      )}

      {/* Ban Dialog */}
      {actionState.type === "ban" && (
        <ConfirmDialog
          open={actionState.open}
          onOpenChange={(open) =>
            setActionState({ type: open ? "ban" : null, open })
          }
          title="Ban User"
          description="Permanently ban this user. This action cannot be undone easily."
          confirmText="Ban"
          variant="destructive"
          requireTypedConfirmation={{
            text: "BAN",
            placeholder: "Type BAN to confirm",
          }}
          onConfirm={() => handleAction("ban", banForm.reason)}
        >
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="ban-reason">Reason</Label>
              <Input
                id="ban-reason"
                value={banForm.reason}
                onChange={(e) => setBanForm({ reason: e.target.value })}
                placeholder="Reason for ban"
                className="mt-1"
              />
            </div>
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
