"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GroupContainer } from "./ui/ios/GroupContainer";
import { ListRow } from "./ui/ios/ListRow";
import { SectionHeader } from "./ui/ios/SectionHeader";
import { SearchInput } from "./ui/ios/SearchInput";
import { Users, MapPin, Calendar, AlertTriangle, Trash2, Eye, Loader2 } from "lucide-react";
import { StatusBadge } from "./ui/ios/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getThumbnailUrl } from "../lib/cloudinary-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Group {
  id: string;
  name: string;
  destination: string | null;
  creator_id: string | null;
  status: string;
  flag_count: number;
  created_at: string;
  cover_image: string | null;
  organizer?: {
    name: string | null;
  } | null;
}

interface AdminGroupsTableProps {
  initialGroups: Group[];
  initialPage: number;
  initialLimit: number;
  initialStatus?: string;
  initialQuery?: string;
  initialFlagged?: string;
}

export function AdminGroupsTable({
  initialGroups,
  initialPage,
  initialLimit,
  initialStatus = "",
  initialQuery = "",
  initialFlagged = "",
}: AdminGroupsTableProps) {
  const router = useRouter();
  const [groups, setGroups] = React.useState<Group[]>(initialGroups);
  const [page, setPage] = React.useState(initialPage);
  const [status, setStatus] = React.useState(initialStatus);
  const [query, setQuery] = React.useState(initialQuery);
  const [flagged, setFlagged] = React.useState(initialFlagged);
  const [isLoading, setIsLoading] = React.useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null);
  const [removeReason, setRemoveReason] = React.useState("");

  const fetchGroups = React.useCallback(
    async (newPage: number, searchQuery: string, statusFilter: string, flaggedFilter: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: newPage.toString(),
          limit: initialLimit.toString(),
        });
        if (searchQuery) params.append("query", searchQuery);
        if (statusFilter) params.append("status", statusFilter);
        if (flaggedFilter) params.append("flagged", flaggedFilter);

        const res = await fetch(`/api/admin/groups?${params}`);
        if (!res.ok) throw new Error("Failed to fetch groups");
        const data = await res.json();
        setGroups(data.groups || []);
        setPage(newPage);

        const urlParams = new URLSearchParams({ page: newPage.toString() });
        if (searchQuery) urlParams.append("query", searchQuery);
        if (statusFilter) urlParams.append("status", statusFilter);
        if (flaggedFilter) urlParams.append("flagged", flaggedFilter);
        router.push(`/groups?${urlParams}`, { scroll: false });
      } catch (error) {
        toast.error("Error", { description: "Failed to fetch groups" });
      } finally {
        setIsLoading(false);
      }
    },
    [initialLimit]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGroups(1, query, status, flagged);
  };

  const handleStatusChange = (newStatus: string) => {
    const val = newStatus === "all" ? "" : newStatus;
    setStatus(val);
    fetchGroups(1, query, val, flagged);
  };

  const handleFlaggedChange = (newFlagged: string) => {
    const val = newFlagged === "all" ? "" : newFlagged;
    setFlagged(val);
    fetchGroups(1, query, status, val);
  };

  const handleRemove = async () => {
    if (!selectedGroup || !removeReason.trim()) return;
    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", reason: removeReason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to remove group");
      toast.success("Success", { description: "Group removed successfully" });
      setRemoveDialogOpen(false);
      setSelectedGroup(null);
      setRemoveReason("");
      fetchGroups(page, query, status, flagged);
    } catch (error) {
      toast.error("Error", { description: "Failed to remove group" });
    }
  };



  return (
    <>
      <div className="space-y-6">
        {/* Search & Filters */}
        <section className="space-y-6">
          <form onSubmit={handleSearch} className="">
            <SearchInput
              placeholder="Search groups by name or destination..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => {
                setQuery("");
                fetchGroups(1, "", status, flagged);
              }}
            />
            <button type="submit" className="hidden" />
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Lifecycle Status</label>
              <Select value={status || "all"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full !h-10 rounded-xl bg-card border-border shadow-none cursor-pointer font-medium">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Safety Status</label>
              <Select value={flagged || "all"} onValueChange={handleFlaggedChange}>
                <SelectTrigger className="w-full !h-10 rounded-xl bg-card border-border shadow-none cursor-pointer font-medium">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectItem value="true">Flagged Only</SelectItem>
                  <SelectItem value="false">Safe Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Results List */}
        <section>
          <SectionHeader>Group Directory {groups.length > 0 && `(${groups.length})`}</SectionHeader>
          <GroupContainer shadow={false}>
            {isLoading ? (
              <div className="h-[60vh] flex items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : groups.length === 0 ? (
              <div className="h-[60vh] flex items-center justify-center text-muted-foreground text-sm font-medium">No groups found</div>
            ) : (
              groups.map((group) => (
                <ListRow
                  key={group.id}
                  onClick={() => router.push(`/groups/${group.id}`)}
                  icon={
                    group.cover_image ? (
                      <div className="h-10 w-10 rounded-full overflow-hidden truncate border-none shadow-none flex-shrink-0">
                        <Avatar className="h-full w-full rounded-full">
                          <AvatarImage 
                            src={getThumbnailUrl(group.cover_image)} 
                            alt={group.name} 
                            className="object-cover" 
                          />
                          <AvatarFallback className="rounded-full bg-secondary text-gray-500 text-sm font-semibold">
                            {group.name.substring(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ) : (
                      <div className={cn(
                        "p-2 rounded-full h-10 w-10 flex items-center justify-center shrink-0",
                        group.status === 'removed' ? "bg-muted text-muted-foreground" : "bg-secondary text-gray-500 border border-border"
                      )}>
                        <Users className="h-4 w-4" />
                      </div>
                    )
                  }
                  label={group.name}
                  secondary={group.organizer?.name || "Unknown Organizer"}
                  trailing={
                    <div className="flex items-center gap-6">
                      <div className="flex flex-row items-center gap-4">
                        {/* {group.flag_count > 0 && (
                          <StatusBadge status={`${group.flag_count} Flags`} />
                        )} */}
                        <StatusBadge status={group.status} />
                      </div>
                      {/* <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/groups/${group.id}`); }}
                          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {group.status !== "removed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroup(group);
                              setRemoveDialogOpen(true);
                            }}
                            className="p-2 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div> */}
                    </div>
                  }
                  showChevron={false}
                />
              ))
            )}
          </GroupContainer>
        </section>

        {/* Pagination Section */}
        {!isLoading && groups.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-1 pt-0 pb-8">
            <p className="text-sm text-muted-foreground order-2 sm:order-1">
              Directory Page: <span className="font-semibold text-foreground">{page}</span>
            </p>
            <div className="flex items-center gap-3 order-1 sm:order-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchGroups(page - 1, query, status, flagged)} 
                disabled={page === 1}
                className="h-9 px-5 rounded-xl border-border bg-card shadow-none font-semibold hover:bg-secondary transition-all disabled:opacity-50 cursor-pointer"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchGroups(page + 1, query, status, flagged)} 
                disabled={groups.length < initialLimit}
                className="h-9 px-5 rounded-xl border-border bg-card shadow-none font-semibold hover:bg-secondary transition-all disabled:opacity-50 cursor-pointer"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title="Remove Group"
        description="This action will dismantle the group and notify members. Please provide a reason."
        variant="destructive"
        confirmText="Remove Group"
        onConfirm={handleRemove}
        validate={() => removeReason.trim().length > 0}
      >
        <div className="space-y-4 mt-4">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Internal Reason</label>
          <textarea
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
            placeholder="Why is this group being removed?"
            className="w-full min-h-[120px] rounded-xl border-none bg-muted/40 px-4 py-3 text-[15px] focus:ring-1 ring-primary/20 transition-all outline-none"
            required
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
