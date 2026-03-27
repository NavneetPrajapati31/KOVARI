"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ConfirmDialog";
import { ToastContainer, useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { getThumbnailUrl } from "@/lib/cloudinary-client";
import { GroupContainer } from "./ui/ios/GroupContainer";
import { ListRow } from "./ui/ios/ListRow";
import { SectionHeader } from "./ui/ios/SectionHeader";
import { StatusBadge } from "./ui/ios/StatusBadge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { 
  Users, 
  MapPin, 
  Calendar, 
  Wallet, 
  Globe, 
  Heart, 
  ShieldAlert, 
  History, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ChevronLeft
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  destination: string | null;
  description: string | null;
  notes: string | null;
  status: string;
  flag_count: number;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  is_public: boolean | null;
  budget: number;
  cover_image: string | null;
  creator_id: string | null;
  members_count: number;
  dominant_languages: string[] | null;
  top_interests: string[] | null;
  non_smokers: boolean | null;
  non_drinkers: boolean | null;
  average_age: number | null;
  destination_lat: number | null;
  destination_lon: number | null;
  removed_reason: string | null;
  removed_at: string | null;
}


interface Flag {
  id: string;
  group_id: string;
  reporter_id: string | null;
  reason: string | null;
  evidence_url: string | null;
  status: string;
  created_at: string;
}

interface AdminAction {
  id: string;
  action: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admins: {
    id: string;
    email: string;
  } | null;
}

interface GroupDetailProps {
  group: Group;
  membersCount: number;
  members: Array<{
    id: string;
    user_id: string;
    name: string;
    email: string;
    verified: boolean;
    profile_photo: string | null;
  }>;
  images: Array<{
    id: string;
    url: string;
    type: string;
    uploaded_by: string | null;
    created_at: string;
  }>;
  flags: Flag[];
  adminActions: AdminAction[];
  flagId?: string;
}

export function GroupDetail({
  group,
  membersCount,
  members,
  flags,
  adminActions,
  flagId,
}: GroupDetailProps) {
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [warnDialogOpen, setWarnDialogOpen] = React.useState(false);
  const [warnReason, setWarnReason] = React.useState("");
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [removeReason, setRemoveReason] = React.useState("");

  const handleAction = async (action: string, reason?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${group.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, flagId }),
      });

      if (!res.ok) throw new Error(`Failed to ${action} group`);
      
      toast({
        title: "Success",
        description: `Group ${action}ed successfully`,
        variant: "success",
      });

      setApproveDialogOpen(false);
      setWarnDialogOpen(false);
      setRemoveDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Action failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-US", { 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  return (
    <div className="space-y-12 pb-20">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Main Content: Single Column Stack */}
      <div className="space-y-8 max-w-full mx-auto mt-4">
        {/* Header Identity Card */}
        <section>
          <GroupContainer className="shadow-none">
            <ListRow 
              icon={
                group.cover_image ? (
                 <div className="h-10 w-10 rounded-full overflow-hidden border-none shadow-none flex-shrink-0">
                      <Avatar className="h-full w-full rounded-full">
                        <AvatarImage 
                          src={getThumbnailUrl(group.cover_image)} 
                          alt={group.name} 
                          className="object-cover" 
                        />
                        <AvatarFallback className="rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                          {group.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                )
              }
              label={group.name}
              secondary={
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {group.destination || "Flexible Destination"}
                </div>
              }
              trailing={
                <StatusBadge status={group.status} />
              }
              onClick={() => {}}
              showChevron={false}
              className="hover:bg-card active:bg-card cursor-default"
            />
            
            {/* Action Buttons Integrated into Header Card */}
            <div className="border-none p-3 pt-4 flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setWarnDialogOpen(true)}
                className="flex-1 rounded-xl !h-9 text-sm"
              >
                Issue Warning
              </Button>
              
              {group.status === 'pending' ? (
                <Button 
                  onClick={() => setApproveDialogOpen(true)}
                  className="flex-1 rounded-xl !h-9 text-sm"
                >
                  Approve Group
                </Button>
              ) : group.status !== 'removed' ? (
                <Button 
                  onClick={() => setRemoveDialogOpen(true)}
                  className="flex-1 rounded-xl !h-9 text-sm"
                >
                  Dismantle
                </Button>
              ) : null}
            </div>
          </GroupContainer>
        </section>

          {/* Detailed Info */}
          <section>
            <SectionHeader>Group Details</SectionHeader>
            <GroupContainer>
              <ListRow 
                icon={<Info className="h-5 w-5 text-muted-foreground" />}
                label="Description"
                secondary={group.description || "No description provided."}
                showChevron={false}
              />
              <ListRow 
                icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
                label="Timeline"
                secondary={`${formatDate(group.start_date)} — ${formatDate(group.end_date)}`}
                showChevron={false}
              />
              <ListRow 
                icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
                label="Budget Est."
                secondary={`₹${group.budget.toLocaleString()} per person`}
                showChevron={false}
              />
              <ListRow 
                icon={<Users className="h-5 w-5 text-muted-foreground" />}
                label="Visibility"
                secondary={group.is_public ? "Public Group (Visible in search)" : "Private Group (Invite only)"}
                showChevron={false}
              />
              <ListRow 
                icon={<Globe className="h-5 w-5 text-muted-foreground" />}
                label="Primary Languages"
                secondary={group.dominant_languages?.join(", ") || "No preference"}
                showChevron={false}
              />
               <ListRow 
                icon={<Heart className="h-5 w-5 text-muted-foreground" />}
                label="Lifestyle Rules"
                secondary={
                  <div className="flex items-center gap-1.5">
                    <span className={"text-muted-foreground"}>
                      {group.non_smokers ? "Non-Smoking," : "Smoking Allowed,"}
                    </span>
                    <span className={"text-muted-foreground"}>
                      {group.non_drinkers ? "Non-Drinking" : "Drinking Allowed"}
                    </span>
                  </div>
                }
                showChevron={false}
              />
            </GroupContainer>
          </section>

          {/* Members */}
          {members.length > 0 && (
            <section>
              <SectionHeader>Members</SectionHeader>
              <GroupContainer>
                {members.map((member) => (
                  <ListRow 
                    key={member.id}
                    onClick={() => router.push(`/users/${member.id}`)}
                    icon={
                      <div className="h-10 w-10 rounded-full overflow-hidden border-none shadow-none flex-shrink-0">
                        <Avatar className="h-full w-full rounded-full">
                          <AvatarImage 
                            src={member.profile_photo ? getThumbnailUrl(member.profile_photo) : ""} 
                            alt={member.name} 
                            className="object-cover" 
                          />
                          <AvatarFallback className="rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    }
                    label={member.name}
                    secondary={member.email}
                    trailing={
                      <div className="flex items-center gap-4">
                        {member.user_id === group.creator_id && (
                          <div className="flex items-center gap-1.5 min-w-fit">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span className="text-sm font-medium text-primary">
                              Admin
                            </span>
                          </div>
                        )}
                      </div>
                    }
                    showChevron={false}
                  />
                ))}
              </GroupContainer>
            </section>
          )}

          {/* Removal Info (Conditional) */}
          {group.status === 'removed' && (
            <section>
               <SectionHeader>Removal Metadata</SectionHeader>
               <GroupContainer className="border-red-200 bg-red-50/10">
                  <ListRow 
                    label="Reason for Removal"
                    secondary={group.removed_reason}
                    showChevron={false}
                    destructive={true}
                  />
                  <ListRow 
                    label="Removed At"
                    secondary={formatDate(group.removed_at)}
                    showChevron={false}
                  />
               </GroupContainer>
            </section>
          )}

          {/* Flags Section */}
          {flags.length > 0 && (
            <section>
              <SectionHeader>Active Reports</SectionHeader>
              <GroupContainer className="border-orange-200 bg-orange-50/10">
                {flags.map((flag) => (
                  <ListRow 
                    key={flag.id}
                    icon={<ShieldAlert className="h-5 w-5 text-orange-500" />}
                    label={flag.reason || "Policy Violation"}
                    secondary={formatDateTime(flag.created_at)}
                    trailing={
                        <StatusBadge status={flag.status} />
                    }
                    showChevron={false}
                  />
                ))}
              </GroupContainer>
            </section>
          )}

          {/* Action History */}
          <section>
            <SectionHeader>Admin Timeline</SectionHeader>
            <GroupContainer>
               {adminActions.length === 0 ? (
                 <div className="py-20 text-center text-sm text-muted-foreground font-medium italic">No previous actions recorded</div>
               ) : (
                 adminActions.map((action) => (
                   <ListRow 
                    key={action.id}
                    icon={<History className="h-5 w-5 text-muted-foreground" />}
                    label={action.action}
                    secondary={
                      <div className="space-y-1">
                        <div>{action.reason}</div>
                      </div>
                    }
                    showChevron={false}
                   />
                 ))
               )}
            </GroupContainer>
          </section>
      </div>


      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        title="Approve Group"
        description="This will make the group active and visible to other users. Ensure it follows community guidelines."
        confirmText="Approve"
        onConfirm={() => handleAction("approve")}
      />

      <ConfirmDialog
        open={warnDialogOpen}
        onOpenChange={setWarnDialogOpen}
        title="Send Warning"
        description="The organizer will receive an email highlighting the policy issues. Please specify the violation."
        confirmText="Warn Organizer"
        onConfirm={() => handleAction("warn", warnReason)}
        validate={() => warnReason.trim().length > 0}
      >
        <div className="space-y-4 mt-4">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Internal Reason</label>
          <textarea
            value={warnReason}
            onChange={(e) => setWarnReason(e.target.value)}
            placeholder="What exactly needs to be corrected?"
            className="w-full min-h-[120px] rounded-xl border-none bg-muted/40 px-4 py-3 text-sm focus:ring-1 ring-primary/20 transition-all outline-none"
            required
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title="Remove Group"
        description="This will dismantle the group and notify all members. This action cannot be undone."
        variant="destructive"
        confirmText="Dismantle Group"
        onConfirm={() => handleAction("remove", removeReason)}
        validate={() => removeReason.trim().length > 0}
      >
        <div className="space-y-4 mt-4">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Removal Reason (Public)</label>
          <textarea
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
            placeholder="Provide a reason for the members..."
            className="w-full min-h-[120px] rounded-xl border-none bg-muted/40 px-4 py-3 text-sm focus:ring-1 ring-primary/20 transition-all outline-none"
            required
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
