"use client";

import * as React from "react";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  Calendar as CalendarIcon,
  Copy,
  ChevronDown,
  Download,
  Search,
  Filter,
  User,
  Activity,
  Box
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { GroupContainer } from "@/components/ui/ios/GroupContainer";
import { ListRow } from "@/components/ui/ios/ListRow";
import { SectionHeader } from "@/components/ui/ios/SectionHeader";

interface AdminAction {
  id: string;
  admin_id: string;
  target_type: string;
  target_id: string | null;
  action: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admins?:
    | { id: string; email: string }
    | { id: string; email: string }[]
    | null;
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

  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedAction, setSelectedAction] = React.useState<string | undefined>(undefined);
  const [selectedAdmin, setSelectedAdmin] = React.useState<string | undefined>(undefined);
  const [selectedTargetType, setSelectedTargetType] = React.useState<string | undefined>(undefined);
  const [admins, setAdmins] = React.useState<{ id: string; email: string }[]>([]);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    async function fetchAdmins() {
      try {
        const response = await fetch("/api/admin/audit?limit=1000");
        const data: AuditResponse = await response.json();
        const uniqueAdmins = new Map<string, string>();
        data.actions.forEach((action) => {
          const admin = Array.isArray(action.admins) ? action.admins[0] : action.admins;
          const adminEmail = admin?.email;
          const adminId = action.admin_id;
          if (adminEmail && adminId && !uniqueAdmins.has(adminId)) {
            uniqueAdmins.set(adminId, adminEmail);
          }
        });
        setAdmins(Array.from(uniqueAdmins.entries()).map(([id, email]) => ({ id, email })));
      } catch (error) {
        console.error("Failed to fetch admins:", error);
      }
    }
    fetchAdmins();
  }, []);

  const fetchAuditLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (dateRange.from) params.append("from", dateRange.from.toISOString());
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        params.append("to", toDate.toISOString());
      }
      if (selectedAction) params.append("action", selectedAction);
      if (selectedAdmin) params.append("adminId", selectedAdmin);
      if (selectedTargetType) params.append("targetType", selectedTargetType);

      const response = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      const data: AuditResponse = await response.json();
      setActions(data.actions);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, dateRange, selectedAction, selectedAdmin, selectedTargetType]);

  React.useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  React.useEffect(() => {
    setPage(1);
  }, [dateRange.from, dateRange.to, selectedAction, selectedAdmin, selectedTargetType]);

  const handleDateRangePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateRange({ from, to });
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ format: "csv", limit: "10000" });
      if (dateRange.from) params.append("from", dateRange.from.toISOString());
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        params.append("to", toDate.toISOString());
      }
      if (selectedAction) params.append("action", selectedAction);
      if (selectedAdmin) params.append("adminId", selectedAdmin);
      if (selectedTargetType) params.append("targetType", selectedTargetType);

      const response = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to export");
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
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const formatTimestamp = (timestamp: string) => {
    return formatInTimeZone(new Date(timestamp), "Asia/Kolkata", "MMM dd, HH:mm");
  };

  return (
    <div className="max-w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="space-y-0">
          <h1 className="text-lg font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-md text-muted-foreground">View and filter all administrative actions</p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm" className="rounded-xl h-10 !px-5 gap-2 bg-card transition-all shadow-none">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="space-y-8">
        {/* Filters Section */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-medium !h-11 rounded-xl bg-card border-border shadow-none cursor-pointer", !dateRange.from && "text-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (dateRange.to ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}` : format(dateRange.from, "MMM dd")) : "Pick a date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => handleDateRangePreset(7)} className="text-xs rounded-xl">Last 7 days</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDateRangePreset(30)} className="text-xs rounded-xl">Last 30 days</Button>
                    </div>
                    <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })} numberOfMonths={2} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Action Type</Label>
              <Select value={selectedAction || "all"} onValueChange={(v) => setSelectedAction(v === "all" ? undefined : v)}>
                <SelectTrigger className="w-full !h-11 rounded-xl bg-card border-border shadow-none cursor-pointer font-medium">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All actions</SelectItem>
                  {ACTION_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Admin</Label>
              <Select value={selectedAdmin || "all"} onValueChange={(v) => setSelectedAdmin(v === "all" ? undefined : v)}>
                <SelectTrigger className="w-full !h-11 rounded-xl bg-card border-border shadow-none cursor-pointer font-medium">
                  <SelectValue placeholder="All admins" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All admins</SelectItem>
                  {admins.map((a) => <SelectItem key={a.id} value={a.id}>{a.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Target Type</Label>
              <Select value={selectedTargetType || "all"} onValueChange={(v) => setSelectedTargetType(v === "all" ? undefined : v)}>
                <SelectTrigger className="w-full !h-11 rounded-xl bg-card border-border shadow-none cursor-pointer font-medium">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All types</SelectItem>
                  {TARGET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Logs Section */}
        <section>
          <SectionHeader>Activity Log</SectionHeader>
          <GroupContainer>
            {loading ? (
              <div className="py-24 text-center text-sm text-muted-foreground font-medium">Loading audit logs...</div>
            ) : actions.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">No activity logs found for selected filters</div>
            ) : (
              actions.map((action) => {
                const isExpanded = expandedRows.has(action.id);
                const hasMetadata = action.metadata && Object.keys(action.metadata).length > 0;
                const admin = Array.isArray(action.admins) ? action.admins[0] : action.admins;

                return (
                  <React.Fragment key={action.id}>
                    <ListRow
                      onClick={() => hasMetadata && toggleRowExpansion(action.id)}
                      label={action.action}
                      secondary={`${admin?.email || 'System'} • ${formatTimestamp(action.created_at)}`}
                      trailing={
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-xs uppercase font-semibold tracking-widest text-muted-foreground">{action.target_type}</span>
                            <span className="text-xs font-medium text-muted-foreground">{action.target_id ? (action.target_id.length > 12 ? `${action.target_id.substring(0, 12)}...` : action.target_id) : '—'}</span>
                          </div>
                          {hasMetadata && <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />}
                        </div>
                      }
                      showChevron={false}
                    />
                    {isExpanded && hasMetadata && (
                      <div className="px-6 py-5 bg-card border-b border-border space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Metadata Details</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(JSON.stringify(action.metadata, null, 2)); }}
                            className="text-xs font-semibold text-primary cursor-pointer flex items-center gap-1.5"
                          >
                            <Copy className="h-3 w-3" /> COPY JSON
                          </button>
                        </div>
                        <pre className="text-xs font-mono bg-background/50 p-4 rounded-xl border border-border overflow-auto scrollbar-hide text-muted-foreground">
                          {JSON.stringify(action.metadata, null, 2)}
                        </pre>
                        {action.reason && (
                          <div className="pt-2">
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1">Reason</span>
                            <p className="text-sm text-muted-foreground">{action.reason}</p>
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

        {/* Pagination Section */}
        {!loading && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-1 pt-0 pb-8 border-t border-border/10">
            <p className="text-sm text-muted-foreground order-2 sm:order-1">
              Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-semibold text-foreground">{Math.min(page * limit, total)}</span> of{" "}
              <span className="font-semibold text-foreground">{total}</span> entries
            </p>
            <div className="flex items-center gap-3 order-1 sm:order-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="h-9 px-5 rounded-xl border-border bg-card shadow-none font-semibold hover:bg-secondary transition-all disabled:opacity-30 cursor-pointer"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)} 
                disabled={page * limit >= total}
                className="h-9 px-5 rounded-xl border-border bg-card shadow-none font-semibold hover:bg-secondary transition-all disabled:opacity-30 cursor-pointer"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
