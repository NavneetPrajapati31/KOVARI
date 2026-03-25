"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ConfirmDialog";
import { ToastContainer, useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { GroupContainer } from "./ui/ios/GroupContainer";
import { ListRow } from "./ui/ios/ListRow";
import { SectionHeader } from "./ui/ios/SectionHeader";
import { SearchInput } from "./ui/ios/SearchInput";
import { Users, MapPin, Calendar, AlertTriangle, Trash2, Eye } from "lucide-react";
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
}

interface AdminGroupsTableProps {
  initialGroups: Group[];
  initialPage: number;
  initialLimit: number;
  initialStatus?: string;
  initialQuery?: string;
}

export function AdminGroupsTable({
  initialGroups,
  initialPage,
  initialLimit,
  initialStatus = "",
  initialQuery = "",
}: AdminGroupsTableProps) {
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();
  const [groups, setGroups] = React.useState<Group[]>(initialGroups);
  const [page, setPage] = React.useState(initialPage);
  const [status, setStatus] = React.useState(initialStatus);
  const [query, setQuery] = React.useState(initialQuery);
  const [isLoading, setIsLoading] = React.useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null);
  const [removeReason, setRemoveReason] = React.useState("");

  const fetchGroups = React.useCallback(
    async (newPage: number, searchQuery: string, statusFilter: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: newPage.toString(),
          limit: initialLimit.toString(),
        });
        if (searchQuery) params.append("query", searchQuery);
        if (statusFilter) params.append("status", statusFilter);

        const res = await fetch(`/api/admin/groups?${params}`);
        if (!res.ok) throw new Error("Failed to fetch groups");
        const data = await res.json();
        setGroups(data.groups || []);
        setPage(newPage);
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch groups", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [initialLimit, toast]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGroups(1, query, status);
  };

  const handleStatusChange = (newStatus: string) => {
    const val = newStatus === "all" ? "" : newStatus;
    setStatus(val);
    fetchGroups(1, query, val);
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
      toast({ title: "Success", description: "Group removed successfully" });
      setRemoveDialogOpen(false);
      setSelectedGroup(null);
      setRemoveReason("");
      fetchGroups(page, query, status);
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove group", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const statusColors: Record<string, string> = {
    active: "text-green-500",
    pending: "text-amber-500",
    removed: "text-red-500",
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="space-y-10">
        {/* Search & Filters */}
        <section className="space-y-6">
          <form onSubmit={handleSearch} className="px-1">
            <SearchInput
              placeholder="Search groups by name or destination..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <div className="px-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Filter by Status</label>
              <Select value={status || "all"} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full h-11 rounded-xl bg-muted/20 border-none font-medium">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Results List */}
        <section>
          <SectionHeader>Active Groups {groups.length > 0 && `(${groups.length})`}</SectionHeader>
          <GroupContainer shadow={false}>
            {isLoading ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground font-medium animate-pulse">Refreshing groups...</div>
            ) : groups.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground/60 text-[15px]">No groups found</div>
            ) : (
              groups.map((group) => (
                <ListRow
                  key={group.id}
                  onClick={() => router.push(`/groups/${group.id}`)}
                  icon={
                    <div className={cn(
                      "p-2 rounded-xl",
                      group.status === 'removed' ? "bg-muted text-muted-foreground/40" : "bg-muted text-muted-foreground/60"
                    )}>
                      <Users className="h-5 w-5" />
                    </div>
                  }
                  label={group.name}
                  secondary={
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-2">
                        {group.destination && (
                          <div className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground/80">
                            <MapPin className="h-3 w-3" /> {group.destination}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground/40">
                          <Calendar className="h-3 w-3" /> {formatDate(group.created_at)}
                        </div>
                      </div>
                    </div>
                  }
                  trailing={
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          {group.flag_count > 0 && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                          <span className={cn("text-[10px] uppercase font-bold tracking-widest", statusColors[group.status] || "text-muted-foreground")}>
                            {group.status}
                          </span>
                        </div>
                        {group.flag_count > 0 && (
                          <span className="text-[11px] font-medium text-orange-500">
                            {group.flag_count} Flags
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/groups/${group.id}`); }}
                          className="p-2 rounded-full hover:bg-muted text-muted-foreground/40 transition-colors"
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
                            className="p-2 rounded-full hover:bg-red-50 text-muted-foreground/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  }
                  showChevron={false}
                />
              ))
            )}
          </GroupContainer>
        </section>

        {/* Pagination */}
        {!isLoading && groups.length > 0 && (
          <div className="flex items-center justify-between px-2 pt-2 pb-10">
            <span className="text-sm text-muted-foreground/60 font-medium">Page {page}</span>
            <div className="flex gap-8">
              <button
                onClick={() => fetchGroups(page - 1, query, status)}
                disabled={page === 1}
                className="text-[15px] font-semibold text-primary disabled:opacity-30 hover:opacity-70 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => fetchGroups(page + 1, query, status)}
                disabled={groups.length < initialLimit}
                className="text-[15px] font-semibold text-primary disabled:opacity-30 hover:opacity-70 transition-all"
              >
                Next
              </button>
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
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Internal Reason</label>
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
