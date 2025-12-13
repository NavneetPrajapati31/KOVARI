"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ConfirmDialog } from "./ConfirmDialog";
import { ToastContainer, useToast } from "./Toast";
import { cn } from "../lib/utils";

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
        if (searchQuery) {
          params.append("query", searchQuery);
        }
        if (statusFilter) {
          params.append("status", statusFilter);
        }

        const res = await fetch(`/api/admin/groups?${params}`);
        if (!res.ok) throw new Error("Failed to fetch groups");
        const data = await res.json();
        setGroups(data.groups || []);
        setPage(newPage);
      } catch (error) {
        console.error("Error fetching groups:", error);
        toast({
          title: "Error",
          description: "Failed to fetch groups",
          variant: "destructive",
        });
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
    setStatus(newStatus);
    fetchGroups(1, query, newStatus);
  };

  const handleRemove = async () => {
    if (!selectedGroup || !removeReason.trim()) return;

    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          reason: removeReason.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove group");
      }

      toast({
        title: "Success",
        description: "Group removed successfully",
      });

      setRemoveDialogOpen(false);
      setSelectedGroup(null);
      setRemoveReason("");
      fetchGroups(page, query, status);
    } catch (error) {
      console.error("Error removing group:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove group",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      active: {
        bg: "bg-green-100 dark:bg-green-900",
        text: "text-green-800 dark:text-green-100",
      },
      pending: {
        bg: "bg-yellow-100 dark:bg-yellow-900",
        text: "text-yellow-800 dark:text-yellow-100",
      },
      removed: {
        bg: "bg-red-100 dark:bg-red-900",
        text: "text-red-800 dark:text-red-100",
      },
    };

    const variant = variants[status] || variants.pending;

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
          variant.bg,
          variant.text
        )}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <Input
              type="text"
              placeholder="Search by name or destination..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" disabled={isLoading}>
              Search
            </Button>
          </form>

          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="removed">Removed</option>
            </select>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Group Name
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Destination
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Flags
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No groups found
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr
                      key={group.id}
                      className={cn(
                        "border-b transition-colors hover:bg-muted/50",
                        group.status === "removed" && "opacity-60"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{group.name}</div>
                          {group.flag_count > 0 && (
                            <span
                              className="inline-flex items-center justify-center size-2 rounded-full bg-orange-500"
                              title="Flagged group"
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {group.destination || "—"}
                      </td>
                      <td className="p-4">{getStatusBadge(group.status)}</td>
                      <td className="p-4">
                        {group.flag_count > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                            {group.flag_count}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            0
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(group.created_at)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/groups/${group.id}`)}
                          >
                            View
                          </Button>
                          {group.status !== "removed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGroup(group);
                                setRemoveDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Page {page}</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchGroups(page - 1, query, status)}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchGroups(page + 1, query, status)}
              disabled={groups.length < initialLimit || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title="Remove Group"
        description="Are you sure you want to remove this group? This action requires a reason."
        variant="destructive"
        confirmText="Remove Group"
        onConfirm={handleRemove}
        validate={() => removeReason.trim().length > 0}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason (required)</label>
          <textarea
            value={removeReason}
            onChange={(e) => setRemoveReason(e.target.value)}
            placeholder="Enter reason for removing this group..."
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
        </div>
      </ConfirmDialog>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
