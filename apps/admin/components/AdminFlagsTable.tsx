"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Eye, ChevronLeft, ChevronRight, User, Users, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { GroupContainer } from "./ui/ios/GroupContainer";
import { ListRow } from "./ui/ios/ListRow";
import { SectionHeader } from "./ui/ios/SectionHeader";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { StatusBadge } from "./ui/ios/StatusBadge";

interface Flag {
  id: string;
  targetType: "user" | "group";
  targetId: string;
  targetName: string;
  targetInfo?: {
    id: string;
    name: string;
    email?: string;
    profile_photo?: string;
  };
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
  const searchParams = useSearchParams();
  const [flags, setFlags] = React.useState<Flag[]>(initialFlags);
  const [page, setPage] = React.useState(initialPage);
  const [status, setStatus] = React.useState(initialStatus);
  const [targetType, setTargetType] = React.useState(initialTargetType);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedFlagId, setSelectedFlagId] = React.useState<string | null>(null);

  // Synchronize modal with URL search params
  React.useEffect(() => {
    const flagId = searchParams.get("flagId");
    if (flagId && flagId !== selectedFlagId) {
      setSelectedFlagId(flagId);
    }
  }, [searchParams, selectedFlagId]);

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


  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Status</label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full !h-10 rounded-xl bg-card border-border shadow-none cursor-pointer font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="actioned">Actioned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ml-1">Focus</label>
            <Select value={targetType} onValueChange={handleTargetTypeChange}>
              <SelectTrigger className="w-full !h-10 rounded-xl bg-card border-border shadow-none cursor-pointer font-medium">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All</SelectItem>
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
          {isLoading ? (
            <div className="h-[60vh] flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : flags.length === 0 ? (
            <div className="h-[60vh] flex items-center justify-center text-muted-foreground text-sm">
              No reports found
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
                    flag.targetInfo?.profile_photo ? (
                      <div className="h-10 w-10 rounded-full overflow-hidden border-none shadow-none flex-shrink-0">
                        <Avatar className="h-full w-full rounded-full">
                          <AvatarImage 
                            src={getThumbnailUrl(flag.targetInfo.profile_photo)} 
                            alt={flag.targetName} 
                            className="object-cover" 
                          />
                          <AvatarFallback className="rounded-full bg-secondary text-gray-500 text-sm font-semibold">
                            {flag.targetName.substring(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ) : (
                      <div className={cn(
                        "p-2 rounded-full h-10 w-10 flex items-center justify-center bg-secondary border border-border"
                      )}>
                        {flag.targetType === "user" ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                      </div>
                    )
                  }
                  label={<span className="">{flag.targetName}</span>}
                  secondary={flag.reason || "No reason specified"}
                  trailing={
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={flag.status} />
                        </div>
                        {/* <span className="text-xs text-muted-foreground font-medium">
                          {formatDate(flag.createdAt)}
                        </span> */}
                      </div>
                    </div>
                  }
                  showChevron={false}
                />
              );
            })
          )}
        </GroupContainer>
      </section>

      {/* Pagination Section */}
      {!isLoading && flags.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-1 pt-0 pb-8">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            Priority View: <span className="font-semibold text-foreground">{page}</span>
          </p>
          <div className="flex items-center gap-3 order-1 sm:order-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(page - 1)} 
              disabled={page === 1}
              className="h-9 px-5 rounded-xl border-border bg-card shadow-none font-semibold hover:bg-secondary transition-all disabled:opacity-50 cursor-pointer"
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(page + 1)} 
              disabled={flags.length < initialLimit}
              className="h-9 px-5 rounded-xl border-border bg-card shadow-none font-semibold hover:bg-secondary transition-all disabled:opacity-50 cursor-pointer"
            >
              Next
            </Button>
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
