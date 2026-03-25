"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ConfirmDialog } from "./ConfirmDialog";
import { ToastContainer, useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { getFullImageUrl } from "../lib/cloudinary-client";
import { GroupContainer } from "./ui/ios/GroupContainer";
import { ListRow } from "./ui/ios/ListRow";
import { SectionHeader } from "./ui/ios/SectionHeader";
import { Avatar } from "@heroui/react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  MessageSquare, 
  History, 
  Info, 
  UserX,
  UserCheck,
  Ban,
  AlertTriangle,
  FileText
} from "lucide-react";

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
  const searchParams = useSearchParams();
  const flagId = searchParams.get("flagId");
  const { toasts, toast, removeToast } = useToast();
  const [profile, setProfile] = React.useState(initialProfile);
  const [flags, setFlags] = React.useState(initialFlags);
  const [notes, setNotes] = React.useState(initialNotes);
  const [isLoading, setIsLoading] = React.useState(false);
  const expectedStateRef = React.useRef<{
    banned?: boolean;
    ban_expires_at?: string | undefined;
  } | null>(null);

  React.useEffect(() => {
    if (expectedStateRef.current) {
      const serverBanned = initialProfile.users?.banned;
      const serverBanExpires = initialProfile.users?.ban_expires_at;
      const expected = expectedStateRef.current;

      if (serverBanned === expected.banned && serverBanExpires === expected.ban_expires_at) {
        expectedStateRef.current = null;
        setProfile(initialProfile);
      }
    } else {
      setProfile(initialProfile);
    }
    setFlags(initialFlags);
    setNotes(initialNotes);
  }, [initialProfile, initialFlags, initialNotes]);

  const [actionState, setActionState] = React.useState<{
    type: "suspend" | "ban" | "warn" | null;
    open: boolean;
  }>({ type: null, open: false });

  const [suspendForm, setSuspendForm] = React.useState({ reason: "", banUntil: "" });
  const [banForm, setBanForm] = React.useState({ reason: "" });
  const [warnForm, setWarnForm] = React.useState({ reason: "" });
  const [noteForm, setNoteForm] = React.useState({ note: "" });
  const [showNoteForm, setShowNoteForm] = React.useState(false);

  const handleAction = async (
    action: "verify" | "ban" | "suspend" | "unban" | "warn",
    reason?: string,
    banUntil?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, banUntil, flagId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Action failed");
      }

      if (action === "ban" || action === "suspend") {
        const banExpiresAt = action === "suspend" ? banUntil : undefined;
        expectedStateRef.current = { banned: true, ban_expires_at: banExpiresAt };
        setProfile((prev) => ({
          ...prev,
          users: { banned: true, ban_reason: reason || `Admin ${action}`, ban_expires_at: banExpiresAt },
        }));
      } else if (action === "unban") {
        expectedStateRef.current = { banned: false, ban_expires_at: undefined };
        setProfile((prev) => ({
          ...prev,
          users: { banned: false, ban_reason: undefined, ban_expires_at: undefined },
        }));
      } else if (action === "verify") {
        setProfile((prev) => ({ ...prev, verified: true }));
      }

      toast({
        title: "Success",
        description: `User ${action}ed successfully`,
        variant: "success",
      });

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

      if (!res.ok) throw new Error("Failed to add note");

      toast({
        title: "Success",
        description: "Note added successfully",
        variant: "success",
      });

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
        description: "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isBanned = profile.users?.banned === true;
  const isSuspended = isBanned && !!profile.users?.ban_expires_at;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="space-y-10 pb-20">
        {/* Profile Header Block */}
        <div className="flex flex-col md:flex-row items-start gap-8 px-2">
          <Avatar
            className={cn("h-32 w-32 border-none shadow-sm", profile.deleted && "opacity-50")}
            style={{ borderRadius: '24px' }}
          >
            <Avatar.Image  src={profile.profile_photo ? getFullImageUrl(profile.profile_photo) : ""}  alt={profile.name || "?"}
            ></Avatar.Image>
            </Avatar>
          <div className="flex-1 pt-2 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{profile.name || "Unknown User"}</h1>
                {profile.verified && <ShieldCheck className="h-6 w-6 text-blue-500" />}
              </div>
              <p className="text-[17px] text-muted-foreground/80 font-medium">{profile.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {isBanned && (
                  <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                    {isSuspended ? "Suspended" : "Banned"}
                  </span>
                )}
                {profile.deleted && (
                  <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    Deleted
                  </span>
                )}
                {!isBanned && !profile.deleted && (
                  <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Info Columns */}
          <div className="lg:col-span-12 space-y-10">
            
            {/* Quick Actions Row */}
            <section>
              <SectionHeader>Account Management</SectionHeader>
              <GroupContainer>
                {!profile.verified && (
                  <ListRow
                    icon={<ShieldCheck className="h-5 w-5 text-blue-500" />}
                    label="Verify Account"
                    secondary="Mark user as officially verified"
                    onClick={() => handleAction("verify")}
                  />
                )}
                {!isBanned && (
                  <>
                    <ListRow
                      icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      label="Issue Warning"
                      secondary="Log a warning and notify user via email"
                      onClick={() => setActionState({ type: "warn", open: true })}
                    />
                    <ListRow
                      icon={<ShieldAlert className="h-5 w-5 text-orange-500" />}
                      label="Suspend User"
                      secondary="Temporary ban with expiration date"
                      onClick={() => setActionState({ type: "suspend", open: true })}
                    />
                    <ListRow
                      icon={<Ban className="h-5 w-5 text-red-500" />}
                      label="Permanent Ban"
                      secondary="Restrict access to the platform permanently"
                      onClick={() => setActionState({ type: "ban", open: true })}
                    />
                  </>
                )}
                {isBanned && (
                  <ListRow
                    icon={<UserCheck className="h-5 w-5 text-green-500" />}
                    label={isSuspended ? "Revoke Suspension" : "Unban User"}
                    secondary="Restore user access immediately"
                    onClick={() => handleAction("unban")}
                  />
                )}
                <ListRow
                  icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
                  label="Internal Note"
                  secondary="Add private moderation log"
                  onClick={() => setShowNoteForm(!showNoteForm)}
                />
              </GroupContainer>
            </section>

            {/* Note Entry Form */}
            {showNoteForm && (
              <section className="px-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="rounded-2xl border bg-card/10 p-5 space-y-4">
                  <Label htmlFor="note" className="text-sm font-semibold opacity-60">Admin Internal Note</Label>
                  <textarea
                    id="note"
                    value={noteForm.note}
                    onChange={(e) => setNoteForm({ note: e.target.value })}
                    placeholder="Enter private note about this user..."
                    className="w-full min-h-[120px] rounded-xl border-none bg-muted/40 px-4 py-3 text-[15px] focus:ring-1 ring-primary/20 transition-all outline-none"
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" className="rounded-full px-6" onClick={() => setShowNoteForm(false)}>Cancel</Button>
                    <Button className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddNote} disabled={!noteForm.note.trim() || isLoading}>
                      Save Note
                    </Button>
                  </div>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Profile Details */}
              <section>
                <SectionHeader>Personal Details</SectionHeader>
                <GroupContainer>
                  <ListRow label="Age" trailing={<span className="font-medium text-[15px]">{profile.age}</span>} showChevron={false} />
                  <ListRow label="Gender" trailing={<span className="font-medium text-[15px]">{profile.gender}</span>} showChevron={false} />
                  <ListRow label="Nationality" trailing={<span className="font-medium text-[15px]">{profile.nationality}</span>} showChevron={false} />
                  {profile.religion && <ListRow label="Religion" trailing={<span className="font-medium text-[15px]">{profile.religion}</span>} showChevron={false} />}
                  {profile.smoking && <ListRow label="Smoking" trailing={<span className="font-medium text-[15px]">{profile.smoking}</span>} showChevron={false} />}
                  {profile.drinking && <ListRow label="Drinking" trailing={<span className="font-medium text-[15px]">{profile.drinking}</span>} showChevron={false} />}
                </GroupContainer>
              </section>

              {/* Preferences & Bio */}
              <section>
                <SectionHeader>Bio & Preferences</SectionHeader>
                <GroupContainer>
                  <ListRow 
                    label="Bio" 
                    secondary={profile.bio || "No bio provided"} 
                    showChevron={false}
                  />
                  <ListRow 
                    label="Personality" 
                    secondary={profile.personality || "Not specified"} 
                    showChevron={false}
                  />
                  {profile.languages && (
                    <ListRow 
                      label="Languages" 
                      secondary={profile.languages.join(", ")} 
                      showChevron={false}
                    />
                  )}
                  {profile.interests && (
                    <ListRow 
                      label="Interests" 
                      secondary={profile.interests.join(", ")} 
                      showChevron={false}
                    />
                  )}
                </GroupContainer>
              </section>
            </div>

            {/* Flags & History */}
            {flags.length > 0 && (
              <section>
                <SectionHeader>User Flags ({flags.length})</SectionHeader>
                <GroupContainer>
                  {flags.map((flag) => (
                    <ListRow
                      key={flag.id}
                      icon={<AlertTriangle className={cn("h-5 w-5", flag.status === 'pending' ? 'text-orange-500' : 'text-muted-foreground/40')} />}
                      label={flag.type}
                      secondary={flag.reason}
                      trailing={
                        <div className="flex flex-col items-end">
                          <span className={cn("text-[11px] font-bold uppercase", flag.status === 'pending' ? 'text-orange-600' : 'text-muted-foreground')}>
                            {flag.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground/40">
                            {new Date(flag.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      }
                      showChevron={false}
                    />
                  ))}
                </GroupContainer>
              </section>
            )}

            {/* Admin Internal History */}
            {notes.length > 0 && (
              <section>
                <SectionHeader>Moderation History</SectionHeader>
                <GroupContainer>
                  {notes.map((note) => (
                    <ListRow
                      key={note.id}
                      icon={<FileText className="h-5 w-5 text-muted-foreground/60" />}
                      label={note.reason}
                      secondary={`${note.admins?.email} • ${new Date(note.created_at).toLocaleString()}`}
                      showChevron={false}
                    />
                  ))}
                </GroupContainer>
              </section>
            )}

            {/* Technical Sessions */}
            {initialSessions.length > 0 && (
              <section>
                <SectionHeader>Active System Sessions</SectionHeader>
                <GroupContainer>
                  {initialSessions.map((session, idx) => (
                    <div key={idx} className="p-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <History className="h-4 w-4 text-muted-foreground/60" />
                        <span className="text-xs font-mono font-medium text-muted-foreground">{session.key}</span>
                      </div>
                      <pre className="text-[12px] bg-muted/20 p-4 rounded-xl overflow-x-auto text-muted-foreground/80 scrollbar-hide">
                        {JSON.stringify(session.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </GroupContainer>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Action Dialogs */}
      {actionState.type === "warn" && (
        <ConfirmDialog
          open={actionState.open}
          onOpenChange={(open) => setActionState({ type: open ? "warn" : null, open })}
          title="Warn User"
          description="Send a warning to this user. This will be logged and they will receive an email."
          confirmText="Send Warning"
          validate={() => !!warnForm.reason.trim()}
          onConfirm={() => handleAction("warn", warnForm.reason)}
        >
          <div className="space-y-4 mt-4">
            <Label htmlFor="warn-reason">Warning Message</Label>
            <textarea
              id="warn-reason"
              value={warnForm.reason}
              onChange={(e) => setWarnForm({ reason: e.target.value })}
              placeholder="Reason for warning (sent to user)"
              className="w-full min-h-[100px] rounded-xl border bg-muted/40 px-3 py-2 text-sm mt-1 focus:ring-1 ring-primary/20 outline-none"
            />
          </div>
        </ConfirmDialog>
      )}

      {actionState.type === "suspend" && (
        <ConfirmDialog
          open={actionState.open}
          onOpenChange={(open) => setActionState({ type: open ? "suspend" : null, open })}
          title="Suspend User"
          description="Temporarily suspend this user. They will be unable to access the platform until the suspension expires."
          confirmText="Suspend"
          variant="destructive"
          validate={() => !!suspendForm.reason.trim() && !!suspendForm.banUntil}
          onConfirm={() => handleAction("suspend", suspendForm.reason, suspendForm.banUntil)}
        >
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="suspend-reason">Reason</Label>
              <Input
                id="suspend-reason"
                value={suspendForm.reason}
                onChange={(e) => setSuspendForm({ ...suspendForm, reason: e.target.value })}
                placeholder="Reason for suspension"
                className="mt-1 rounded-xl bg-muted/40 border-none"
              />
            </div>
            <div>
              <Label htmlFor="suspend-until">Suspension Expires</Label>
              <Input
                id="suspend-until"
                type="datetime-local"
                value={suspendForm.banUntil}
                onChange={(e) => setSuspendForm({ ...suspendForm, banUntil: e.target.value })}
                className="mt-1 rounded-xl bg-muted/40 border-none"
              />
            </div>
          </div>
        </ConfirmDialog>
      )}

      {actionState.type === "ban" && (
        <ConfirmDialog
          open={actionState.open}
          onOpenChange={(open) => setActionState({ type: open ? "ban" : null, open })}
          title="Ban User"
          description="Permanently ban this user. This action cannot be undone easily."
          confirmText="Ban"
          variant="destructive"
          requireTypedConfirmation={{ text: "BAN", placeholder: "Type BAN to confirm" }}
          onConfirm={() => handleAction("ban", banForm.reason)}
        >
          <div className="space-y-4 mt-4">
            <Label htmlFor="ban-reason">Reason</Label>
            <Input
              id="ban-reason"
              value={banForm.reason}
              onChange={(e) => setBanForm({ reason: e.target.value })}
              placeholder="Reason for ban"
              className="mt-1 rounded-xl bg-muted/40 border-none"
            />
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
