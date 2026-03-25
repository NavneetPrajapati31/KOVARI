"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { getThumbnailUrl } from "../lib/cloudinary-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { FlagDetailModal } from "./FlagDetailModal";
import { Eye, ChevronLeft, ChevronRight, User, Users, Clock, AlertTriangle } from "lucide-react";
import { GroupContainer } from "./ui/ios/GroupContainer";
import { ListRow } from "./ui/ios/ListRow";
import { SectionHeader } from "./ui/ios/SectionHeader";

interface Flag {
  id: string;
  targetType: "user" | "group";
  targetId: string;
  targetName: string;
  reason: string;
  evidenceUrl: string | null;
  createdAt: string;
  status: string;
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
        if (newTargetType !== "all") params.append("targetType", newTargetType);

        const res = await fetch(`/api/admin/flags?${params}`);
        if (!res.ok) throw new Error("Failed to fetch flags");
        const data = await res.json();
        setFlags(data.flags || []);
        setPage(newPage);
        setStatus(newStatus);
        setTargetType(newTargetType);
        
        const urlParams = new URLSearchParams({ page: newPage.toString(), status: newStatus });
        if (newTargetType !== "all") urlParams.append("targetType", newTargetType);
        router.push(`/flags?${urlParams}`, { scroll: false });
      } catch (error) {
        console.error("Error fetching flags:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [initialLimit, router]
  );

  const handleStatusChange = (newStatus: string) => fetchFlags(1, newStatus, targetType);
  const handleTargetTypeChange = (newTargetType: string) => fetchFlags(1, status, newTargetType);
  const handlePageChange = (newPage: number) => { if (newPage >= 1) fetchFlags(newPage, status, targetType); };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColors = {
    pending: "text-amber-500",
    dismissed: "text-muted-foreground/60",
    actioned: "text-green-500",
  };

  return (
    <div className="space-y-10">
      {/* Filters Section */}
      <section>
        <SectionHeader>Filters</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Status</label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full h-11 rounded-xl bg-muted/20 border-none font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="actioned">Actioned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Focus</label>
            <Select value={targetType} onValueChange={handleTargetTypeChange}>
              <SelectTrigger className="w-full h-11 rounded-xl bg-muted/20 border-none font-medium">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Everything</SelectItem>
                <SelectItem value="user">User Reports</SelectItem>
                <SelectItem value="group">Group Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Queue Section */}
      <section>
        <SectionHeader>Report Queue {flags.length > 0 && `(${flags.length})`}</SectionHeader>
        <GroupContainer shadow={false}>
          {flags.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground/60 text-[15px]">
              {isLoading ? "Refreshing queue..." : "No reports found"}
            </div>
          ) : (
            flags.map((flag) => {
              const flagAge = Date.now() - new Date(flag.createdAt).getTime();
              const isOldFlag = flagAge > 24 * 60 * 60 * 1000;
              
              return (
                <ListRow
                  key={flag.id}
                  onClick={() => setSelectedFlagId(flag.id)}
                  icon={
                    <div className={cn(
                      "p-2 rounded-xl",
                      isOldFlag && status === 'pending' ? "bg-red-50 text-red-500" : "bg-muted text-muted-foreground/60"
                    )}>
                      {flag.targetType === "user" ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>
                  }
                  label={flag.targetName}
                  secondary={flag.reason || "No reason specified"}
                  trailing={
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          {isOldFlag && status === 'pending' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          <span className={cn("text-[10px] uppercase font-bold tracking-widest", statusColors[flag.status as keyof typeof statusColors] || "text-muted-foreground")}>
                            {flag.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground/40 font-medium">
                          {formatDate(flag.createdAt)}
                        </span>
                      </div>
                      {flag.evidenceUrl && (
                        <div className="h-10 w-10 rounded-xl overflow-hidden border border-border/10 shadow-sm flex-shrink-0">
                          <img
                            src={getThumbnailUrl(flag.evidenceUrl)}
                            alt="Evidence"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  }
                />
              );
            })
          )}
        </GroupContainer>
      </section>

      {/* Pagination */}
      {!isLoading && flags.length > 0 && (
        <div className="flex items-center justify-between px-2 pt-2 pb-10">
          <span className="text-sm text-muted-foreground/60 font-medium italic">
            Priority View: {page}
          </span>
          <div className="flex gap-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="text-[15px] font-semibold text-primary disabled:opacity-30 hover:opacity-70 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={flags.length < initialLimit}
              className="text-[15px] font-semibold text-primary disabled:opacity-30 hover:opacity-70 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedFlagId && (
        <FlagDetailModal
          flagId={selectedFlagId}
          open={!!selectedFlagId}
          onOpenChange={(open: boolean) => !open && setSelectedFlagId(null)}
          onActionComplete={async () => {
            await fetchFlags(1, status, targetType);
            if (page !== 1) router.push(`/flags?page=1&status=${status}&targetType=${targetType}`);
          }}
        />
      )}
    </div>
  );
}
