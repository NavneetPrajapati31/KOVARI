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

interface Organizer {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  profile_photo: string | null;
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
  organizer: Organizer | null;
  membersCount: number;
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
  organizer,
  membersCount,
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

      {/* Hero / Header Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
          <div className="space-y-3">
             <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight">{group.name}</h1>
                <StatusBadge status={group.status} />
             </div>
             <div className="flex items-center gap-2 text-[17px] text-muted-foreground/80 font-medium">
                <MapPin className="h-4 w-4" />
                <span>{group.destination || "Flexible Destination"}</span>
                <span className="mx-1 opacity-20">•</span>
                <span>{membersCount} members</span>
             </div>
          </div>
          
          <div className="flex gap-3">
            {group.status === 'pending' && (
              <Button 
                onClick={() => setApproveDialogOpen(true)}
                className="rounded-full bg-primary h-11 px-8 font-bold ios-shadow"
              >
                Approve Group
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setWarnDialogOpen(true)}
              className="rounded-full h-11 px-6 font-bold border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300"
            >
              Issue Warning
            </Button>
            {group.status !== 'removed' && (
              <Button 
                variant="destructive" 
                onClick={() => setRemoveDialogOpen(true)}
                className="rounded-full h-11 px-6 font-bold"
              >
                Remove Group
              </Button>
            )}
          </div>
        </div>

        {group.cover_image && (
          <div className="px-1">
            <div className="h-64 md:h-80 w-full rounded-2xl overflow-hidden shadow-sm border border-border/10">
              <img 
                src={getThumbnailUrl(group.cover_image)} 
                alt="Group Cover" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          {/* Detailed Info */}
          <section>
            <SectionHeader>Group Details</SectionHeader>
            <GroupContainer>
              <ListRow 
                icon={<Info className="h-5 w-5 text-blue-500" />}
                label="Description"
                secondary={group.description || "No description provided."}
                showChevron={false}
              />
              <ListRow 
                icon={<Calendar className="h-5 w-5 text-muted-foreground/40" />}
                label="Timeline"
                secondary={`${formatDate(group.start_date)} — ${formatDate(group.end_date)}`}
                showChevron={false}
              />
              <ListRow 
                icon={<Wallet className="h-5 w-5 text-muted-foreground/40" />}
                label="Budget Est."
                secondary={`₹${group.budget.toLocaleString()} per person`}
                showChevron={false}
              />
              <ListRow 
                icon={<Info className="h-5 w-5 text-muted-foreground/40" />}
                label="Visibility"
                secondary={group.is_public ? "Public Group (Visible in search)" : "Private Group (Invite only)"}
                showChevron={false}
              />
            </GroupContainer>
          </section>

          {/* Organizer */}
          <section>
            <SectionHeader>Organizer</SectionHeader>
            <GroupContainer>
              {organizer ? (
                <ListRow 
                  onClick={() => router.push(`/users/${organizer.id}`)}
                  icon={
                    <div className="h-8 w-8 rounded-full overflow-hidden border-none shadow-none flex-shrink-0">
                      <Avatar className="h-full w-full rounded-full">
                        <AvatarImage 
                          src={organizer.profile_photo ? getThumbnailUrl(organizer.profile_photo) : ""} 
                          alt={organizer.name} 
                          className="object-cover" 
                        />
                        <AvatarFallback className="rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                          {organizer.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  }
                  label={organizer.name}
                  secondary={organizer.email}
                  trailing={
                    organizer.verified && (
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest px-2 py-0.5 bg-green-50 rounded border border-green-100">
                        Verified
                      </span>
                    )
                  }
                />
              ) : (
                <ListRow 
                  label="No Organizer"
                  secondary="System or deleted user"
                  showChevron={false}
                />
              )}
            </GroupContainer>
          </section>

          {/* Preferences */}
          <section>
            <SectionHeader>Vibe & Preferences</SectionHeader>
            <GroupContainer>
               <ListRow 
                icon={<Globe className="h-5 w-5 text-muted-foreground/40" />}
                label="Primary Languages"
                secondary={group.dominant_languages?.join(", ") || "No preference"}
                showChevron={false}
              />
               <ListRow 
                icon={<Heart className="h-5 w-5 text-muted-foreground/40" />}
                label="Interests"
                secondary={group.top_interests?.join(", ") || "No specific tags"}
                showChevron={false}
              />
               <ListRow 
                label="Lifestyle Rules"
                secondary={
                  <div className="flex gap-3 mt-1">
                    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded border", group.non_smokers ? "bg-green-50 text-green-600 border-green-100" : "bg-muted text-muted-foreground opacity-40 border-transparent")}>Non-Smoking</span>
                    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded border", group.non_drinkers ? "bg-green-50 text-green-600 border-green-100" : "bg-muted text-muted-foreground opacity-40 border-transparent")}>Non-Drinking</span>
                  </div>
                }
                showChevron={false}
              />
            </GroupContainer>
          </section>

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
        </div>

        <div className="lg:col-span-4 space-y-12">
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
                 <div className="py-8 text-center text-[13px] text-muted-foreground/40 font-medium italic">No previous actions recorded</div>
               ) : (
                 adminActions.map((action) => (
                   <ListRow 
                    key={action.id}
                    icon={<History className="h-5 w-5 text-muted-foreground/30" />}
                    label={action.action}
                    secondary={
                      <div className="space-y-1">
                        <div>{action.reason}</div>
                        <div className="flex items-center gap-1.5 text-[11px] opacity-40 font-bold">
                           <span>BY {action.admins?.email?.split('@')[0].toUpperCase()}</span>
                           <span>•</span>
                           <span>{formatDateTime(action.created_at)}</span>
                        </div>
                      </div>
                    }
                    showChevron={false}
                   />
                 ))
               )}
            </GroupContainer>
          </section>
        </div>
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
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Internal Reason</label>
          <textarea
            value={warnReason}
            onChange={(e) => setWarnReason(e.target.value)}
            placeholder="What exactly needs to be corrected?"
            className="w-full min-h-[120px] rounded-xl border-none bg-muted/40 px-4 py-3 text-[15px] focus:ring-1 ring-primary/20 transition-all outline-none"
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
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Removal Reason (Public)</label>
          <textarea
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
            placeholder="Provide a reason for the members..."
            className="w-full min-h-[120px] rounded-xl border-none bg-muted/40 px-4 py-3 text-[15px] focus:ring-1 ring-primary/20 transition-all outline-none"
            required
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
