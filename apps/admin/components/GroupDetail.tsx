"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "sonner";
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
  ChevronLeft,
  ChevronDown,
  Copy
} from "lucide-react";
import { Textarea } from "./ui/textarea";

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
  const [isLoading, setIsLoading] = React.useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [warnDialogOpen, setWarnDialogOpen] = React.useState(false);
  const [warnReason, setWarnReason] = React.useState("");
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [removeReason, setRemoveReason] = React.useState("");
  const [expandedActions, setExpandedActions] = React.useState<Set<string>>(new Set());

  const toggleActionExpansion = (id: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedActions(newExpanded);
  };

  const handleAction = async (action: string, reason?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${group.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, flagId }),
      });

      if (!res.ok) throw new Error(`Failed to ${action} group`);
      
      toast.success("Success", {
        description: `Group ${action}ed successfully`,
      });

      setApproveDialogOpen(false);
      setWarnDialogOpen(false);
      setRemoveDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Action failed",
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
    <div className="space-y-12 pb-12">
      
      {/* Main Content: Single Column Stack */}
      <div className="space-y-8 max-w-full mx-auto mt-4">
        {/* Header Identity Card */}
        <section>
          <GroupContainer className="shadow-none md:divide-y-0">
            <ListRow 
              icon={
                group.cover_image ? (
                 <div className="h-10 w-10 rounded-full overflow-hidden border-none shadow-none flex-shrink-0">
                      <Avatar className="h-full w-full rounded-full">
                        <AvatarImage 
                          src={getThumbnailUrl(group.cover_image)} 
                          alt={group.name || "Group"} 
                          className="object-cover" 
                        />
                        <AvatarFallback className="rounded-full bg-secondary text-gray-500 text-xs font-semibold">
                          {group.name?.substring(0, 2).toUpperCase() || "GR"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border">
                    <Users className="h-4 w-4 text-gray-500" />
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
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setWarnDialogOpen(true)}
                      className="rounded-lg !h-8 text-sm shadow-none"
                    >
                      Issue Warning
                    </Button>
                    
                    {group.status === 'pending' ? (
                      <Button 
                        onClick={() => setApproveDialogOpen(true)}
                        className="rounded-lg !h-8 text-sm shadow-none"
                      >
                        Approve
                      </Button>
                    ) : group.status !== 'removed' ? (
                      <Button 
                        onClick={() => setRemoveDialogOpen(true)}
                        className="rounded-lg !h-8 text-sm"
                      >
                        Dismantle
                      </Button>
                    ) : null}
                  </div>
                  <div className="md:hidden">
                    <StatusBadge status={group.status} />
                  </div>
                </div>
              }
              onClick={() => {}}
              showChevron={false}
              className="hover:bg-card active:bg-card cursor-default"
            />
            
            {/* Action Buttons Integrated into Header Card */}
            <div className="border-none p-3 py-4 flex md:hidden gap-2">
              <Button 
                variant="outline" 
                onClick={() => setWarnDialogOpen(true)}
                className="flex-1 rounded-lg !h-9 shadow-none"
              >
                Issue Warning
              </Button>
              
              {group.status === 'pending' ? (
                <Button 
                  onClick={() => setApproveDialogOpen(true)}
                  className="flex-1 rounded-lg !h-9 shadow-none"
                >
                  Approve Group
                </Button>
              ) : group.status !== 'removed' ? (
                <Button 
                  onClick={() => setRemoveDialogOpen(true)}
                  className="flex-1 rounded-lg !h-9 text-sm"
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
                icon={<CheckCircle2 className="h-5 w-5 text-muted-foreground" />}
                label="Status"
                secondary="Current Status"
                trailing={<StatusBadge status={group.status} />}
                showChevron={false}
                className="hidden md:flex" 
              />
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
                            alt={member.name || "Member"} 
                            className="object-cover" 
                          />
                          <AvatarFallback className="rounded-full bg-secondary text-gray-500 text-sm font-semibold border">
                            {member.name?.substring(0, 1).toUpperCase() || "U"}
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
               <GroupContainer className="">
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
              <GroupContainer className="">
                {flags.map((flag) => (
                  <ListRow 
                    key={flag.id}
                    onClick={() => router.push(`/flags?flagId=${flag.id}`)}
                    icon={<ShieldAlert className="h-5 w-5" />}
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
                 <div className="py-20 text-center text-sm text-muted-foreground font-medium">No previous actions recorded</div>
               ) : (
                 adminActions.map((action) => {
                   const isExpanded = expandedActions.has(action.id);
                   const hasDetails = (action.metadata && Object.keys(action.metadata).length > 0) || action.reason;
                   const adminEmail = action.admins?.email?.split('@')[0] || "System";

                   return (
                     <React.Fragment key={action.id}>
                       <ListRow 
                        onClick={() => hasDetails && toggleActionExpansion(action.id)}
                        icon={<History className={cn("h-5 w-5 transition-colors", "text-muted-foreground")} />}
                        label={action.action}
                        secondary={`${adminEmail} • ${formatDateTime(action.created_at)}`}
                        trailing={
                          hasDetails && (
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                          )
                        }
                        showChevron={false}
                        className={cn("transition-colors", isExpanded && "bg-card")}
                       />
                       {isExpanded && hasDetails && (
                         <div className="px-6 py-5 bg-card border-b border-border space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            {action.reason && (
                             <div className="space-y-1">
                               <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reason</span>
                               <p className="text-sm text-muted-foreground leading-relaxed">{action.reason}</p>
                             </div>
                           )}
                           
                           {action.metadata && Object.keys(action.metadata).length > 0 && (
                             <div className="space-y-2">
                               <div className="flex items-center justify-between">
                                 <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Metadata Details</span>
                                 <button 
                                   onClick={(e) => { 
                                     e.stopPropagation(); 
                                     navigator.clipboard.writeText(JSON.stringify(action.metadata, null, 2));
                                     toast.success("Copied", { description: "Metadata JSON copied to clipboard" });
                                   }}
                                   className="text-xs font-semibold text-primary cursor-pointer flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                 >
                                   <Copy className="h-3 w-3" /> COPY JSON
                                 </button>
                               </div>
                               <pre className="text-xs font-mono bg-background p-4 rounded-xl border border-border overflow-auto scrollbar-hide text-muted-foreground max-h-[200px]">
                                 {JSON.stringify(action.metadata, null, 2)}
                               </pre>
                             </div>
                           )}
                         </div>
                       )}
                     </React.Fragment>
                   );
                 })
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
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-sm font-semibold text-foreground">Internal Reason</label>
          <Textarea
            value={warnReason}
            onChange={(e) => setWarnReason(e.target.value)}
            placeholder="What exactly needs to be corrected?"
            className="min-h-[100px] rounded-lg bg-background border-border shadow-none focus-visible:ring-0 text-sm"
            required
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title="Remove Group"
        description="This will dismantle the group and notify all members. This action cannot be undone."
        confirmText="Dismantle Group"
        onConfirm={() => handleAction("remove", removeReason)}
        validate={() => removeReason.trim().length > 0}
      >
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-sm font-semibold text-foreground">Removal Reason (Public)</label>
          <Textarea
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
            placeholder="Provide a reason for the members..."
            className="min-h-[100px] rounded-lg bg-background border-border shadow-none focus-visible:ring-0 text-sm"
            required
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
