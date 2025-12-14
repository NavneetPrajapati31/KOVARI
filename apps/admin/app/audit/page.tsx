"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Copy,
  ChevronDown,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/admin-lib/utils";

interface AdminAction {
  id: string;
  admin_id: string;
  target_type: string;
  target_id: string | null;
  action: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admins?: { email: string }[];
}

interface AuditResponse {
  page: number;
  limit: number;
  total: number;
  actions: AdminAction[];
}

const ACTION_TYPES = [
  "LOGIN_ADMIN",
  "LOGOUT_ADMIN",
  "VERIFY_USER",
  "BAN_USER",
  "UNBAN_USER",
  "SUSPEND_USER",
  "EXPIRE_SESSION",
  "RESOLVE_FLAG",
  "DISMISS_FLAG",
  "UPDATE_SETTINGS",
  "APPROVE_GROUP",
  "REMOVE_GROUP",
  "WARN_USER",
] as const;

const TARGET_TYPES = [
  "user",
  "session",
  "group",
  "settings",
  "admin",
  "user_flag",
] as const;

export default function AuditPage() {
  const [actions, setActions] = React.useState<AdminAction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [limit] = React.useState(50);

  // Filters
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [selectedAction, setSelectedAction] = React.useState<
    string | undefined
  >(undefined);
  const [selectedAdmin, setSelectedAdmin] = React.useState<string | undefined>(
    undefined
  );
  const [selectedTargetType, setSelectedTargetType] = React.useState<
    string | undefined
  >(undefined);
  const [admins, setAdmins] = React.useState<{ id: string; email: string }[]>(
    []
  );
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(
    new Set()
  );

  // Fetch admins for filter
  React.useEffect(() => {
    async function fetchAdmins() {
      try {
        const response = await fetch("/api/admin/audit?limit=1000");
        const data: AuditResponse = await response.json();
        const uniqueAdmins = new Map<string, string>();
        data.actions.forEach((action) => {
          const adminEmail = action.admins?.[0]?.email;
          const adminId = action.admin_id;
          if (adminEmail && adminId && !uniqueAdmins.has(adminId)) {
            uniqueAdmins.set(adminId, adminEmail);
          }
        });
        setAdmins(
          Array.from(uniqueAdmins.entries()).map(([id, email]) => ({
            id,
            email,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch admins:", error);
      }
    }
    fetchAdmins();
  }, []);

  // Fetch audit logs
  const fetchAuditLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (dateRange.from) {
        params.append("from", dateRange.from.toISOString());
      }
      if (dateRange.to) {
        // Set to end of day
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        params.append("to", toDate.toISOString());
      }
      if (selectedAction) {
        params.append("action", selectedAction);
      }
      if (selectedAdmin) {
        params.append("adminId", selectedAdmin);
      }
      if (selectedTargetType) {
        params.append("targetType", selectedTargetType);
      }

      const response = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data: AuditResponse = await response.json();
      setActions(data.actions);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    dateRange,
    selectedAction,
    selectedAdmin,
    selectedTargetType,
  ]);

  React.useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleDateRangePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateRange({ from, to });
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        format: "csv",
        limit: "10000", // Export all
      });

      if (dateRange.from) {
        params.append("from", dateRange.from.toISOString());
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        params.append("to", toDate.toISOString());
      }
      if (selectedAction && selectedAction !== "all") {
        params.append("action", selectedAction);
      }
      if (selectedAdmin && selectedAdmin !== "all") {
        params.append("adminId", selectedAdmin);
      }
      if (selectedTargetType && selectedTargetType !== "all") {
        params.append("targetType", selectedTargetType);
      }

      const response = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kovari-audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Failed to export audit log");
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "yyyy-MM-dd HH:mm:ss") + " UTC";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Audit Logs</h1>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDateRangePreset(7)}
                      >
                        Last 7 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDateRangePreset(30)}
                      >
                        Last 30 days
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDateRange({ from: undefined, to: undefined })
                        }
                      >
                        Clear
                      </Button>
                    </div>
                    <Calendar
                      mode="range"
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range) => {
                        if (range && "from" in range && "to" in range) {
                          setDateRange({
                            from: range.from,
                            to: range.to,
                          });
                        } else {
                          setDateRange({ from: undefined, to: undefined });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Action Type */}
          <div className="space-y-2">
            <Label>Action Type</Label>
            <Select
              value={selectedAction || "all"}
              onValueChange={(value) =>
                setSelectedAction(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTION_TYPES.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Admin */}
          <div className="space-y-2">
            <Label>Admin</Label>
            <Select
              value={selectedAdmin || "all"}
              onValueChange={(value) =>
                setSelectedAdmin(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All admins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All admins</SelectItem>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Type */}
          <div className="space-y-2">
            <Label>Target Type</Label>
            <Select
              value={selectedTargetType || "all"}
              onValueChange={(value) =>
                setSelectedTargetType(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TARGET_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Target ID</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : actions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                actions.map((action) => {
                  const isExpanded = expandedRows.has(action.id);
                  const hasMetadata =
                    action.metadata && Object.keys(action.metadata).length > 0;

                  return (
                    <React.Fragment key={action.id}>
                      <TableRow
                        className={cn(
                          "cursor-pointer",
                          hasMetadata && "hover:bg-muted/50"
                        )}
                        onClick={() =>
                          hasMetadata && toggleRowExpansion(action.id)
                        }
                      >
                        <TableCell className="font-mono text-xs">
                          {formatTimestamp(action.created_at)}
                        </TableCell>
                        <TableCell>
                          {action.admins?.[0]?.email || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {action.action}
                          </span>
                        </TableCell>
                        <TableCell>{action.target_type}</TableCell>
                        <TableCell>
                          {action.target_id ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">
                                {action.target_id.length > 20
                                  ? `${action.target_id.substring(0, 20)}...`
                                  : action.target_id}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(action.target_id!);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {action.reason ? (
                            <span className="text-sm line-clamp-1">
                              {action.reason}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasMetadata && (
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isExpanded && "transform rotate-180"
                              )}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasMetadata && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">
                                  Metadata
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(
                                      JSON.stringify(action.metadata, null, 2)
                                    )
                                  }
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy JSON
                                </Button>
                              </div>
                              <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                                {JSON.stringify(action.metadata, null, 2)}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)}{" "}
            of {total} logs
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
