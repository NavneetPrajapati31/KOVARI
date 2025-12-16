"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { FlagDetailModal } from "./FlagDetailModal";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface Flag {
  id: string;
  targetType: "user" | "group";
  targetId: string;
  targetName: string;
  reason: string;
  evidenceUrl: string | null;
  createdAt: string;
  status: string;
  isOldFlag?: boolean; // PHASE 8: Flag older than 24 hours
}

interface AdminFlagsTableProps {
  initialFlags: Flag[];
  initialPage: number;
  initialLimit: number;
  initialStatus: string;
  initialTargetType?: string;
}

export function AdminFlagsTable({
  initialFlags,
  initialPage,
  initialLimit,
  initialStatus = "pending",
  initialTargetType = "all",
}: AdminFlagsTableProps) {
  const router = useRouter();
  const [flags, setFlags] = React.useState<Flag[]>(initialFlags);
  const [page, setPage] = React.useState(initialPage);
  const [status, setStatus] = React.useState(initialStatus);
  const [targetType, setTargetType] = React.useState(initialTargetType);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedFlagId, setSelectedFlagId] = React.useState<string | null>(null);

  const fetchFlags = React.useCallback(
    async (newPage: number, newStatus: string, newTargetType: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: newPage.toString(),
          limit: initialLimit.toString(),
          status: newStatus,
        });
        
        if (newTargetType !== "all") {
          params.append("targetType", newTargetType);
        }

        const res = await fetch(`/api/admin/flags?${params}`);
        if (!res.ok) throw new Error("Failed to fetch flags");
        const data = await res.json();
        setFlags(data.flags || []);
        setPage(newPage);
        setStatus(newStatus);
        setTargetType(newTargetType);
        
        // Update URL without navigation
        const urlParams = new URLSearchParams({
          page: newPage.toString(),
          status: newStatus,
        });
        if (newTargetType !== "all") {
          urlParams.append("targetType", newTargetType);
        }
        router.push(`/flags?${urlParams}`, { scroll: false });
      } catch (error) {
        console.error("Error fetching flags:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [initialLimit, router]
  );

  const handleStatusChange = (newStatus: string) => {
    fetchFlags(1, newStatus, targetType);
  };

  const handleTargetTypeChange = (newTargetType: string) => {
    fetchFlags(1, status, newTargetType);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
      fetchFlags(newPage, status, targetType);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      },
      dismissed: {
        label: "Dismissed",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
      },
      actioned: {
        label: "Actioned",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "bg-muted text-muted-foreground",
    };

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
          config.className
        )}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by status:</label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="actioned">Actioned</SelectItem>
            </SelectContent>
          </Select>
          
          <label className="text-sm font-medium ml-4">Filter by type:</label>
          <Select value={targetType} onValueChange={handleTargetTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="user">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-500"></span>
                  Solo
                </div>
              </SelectItem>
              <SelectItem value="group">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-500"></span>
                  Group
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Target
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Reason
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Evidence
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Created At
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {flags.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {isLoading ? "Loading..." : "No flags found"}
                  </td>
                </tr>
              ) : (
                flags.map((flag) => {
                  // PHASE 8: Highlight flags older than 24 hours
                  const flagAge = Date.now() - new Date(flag.createdAt).getTime();
                  const isOldFlag = flagAge > 24 * 60 * 60 * 1000; // 24 hours
                  
                  return (
                    <tr
                      key={flag.id}
                      className={cn(
                        "border-b transition-colors hover:bg-muted/50",
                        isOldFlag && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                              flag.targetType === "user"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                            )}
                          >
                            {flag.targetType === "user" ? "User" : "Group"}
                          </span>
                          <span className="font-medium">{flag.targetName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="max-w-md truncate" title={flag.reason}>
                          {flag.reason || "No reason provided"}
                        </div>
                      </td>
                      <td className="p-4">
                        {flag.evidenceUrl ? (
                          <div className="h-12 w-12 overflow-hidden rounded-md border">
                            <img
                              src={flag.evidenceUrl}
                              alt="Evidence"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No evidence</span>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(flag.status)}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {formatDate(flag.createdAt)}
                          {isOldFlag && (
                            <span 
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                              title="Flag is older than 24 hours"
                            >
                              ⚠️ Old
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFlagId(flag.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={flags.length < initialLimit || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Flag Detail Modal */}
      {selectedFlagId && (
        <FlagDetailModal
          flagId={selectedFlagId}
          open={!!selectedFlagId}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setSelectedFlagId(null);
            }
          }}
          onActionComplete={async () => {
            // Refresh flags after action - always go to page 1 to see updated list
            await fetchFlags(1, status, targetType);
            // If we're not on page 1, navigate to page 1
            if (page !== 1) {
              router.push(`/flags?page=1&status=${status}&targetType=${targetType}`);
            }
          }}
        />
      )}
    </div>
  );
}
