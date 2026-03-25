"use client";

import React, { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ToastContainer, useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { GroupContainer } from "@/components/ui/ios/GroupContainer";
import { ListRow } from "@/components/ui/ios/ListRow";
import { SectionHeader } from "@/components/ui/ios/SectionHeader";
import { SearchInput } from "@/components/ui/ios/SearchInput";
import { Activity, Clock, Trash2, User, MapPin, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type SessionRow = {
  sessionKey: string;
  userId: string | null;
  createdAt: string | null;
  ttlSeconds: number | null;
  destination: string | null;
  budget: number | null;
};

export default function SessionsPage() {
  const { toasts, toast, removeToast } = useToast();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string>("0");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    sessionKey: string | null;
    userId: string | null;
  }>({
    open: false,
    sessionKey: null,
    userId: null,
  });

  async function fetchSessions(searchTerm?: string) {
    setLoading(true);
    setError(null);
    try {
      const query = searchTerm || searchQuery;
      const url = query
        ? `/api/admin/sessions/search?query=${encodeURIComponent(query)}&limit=100`
        : `/api/admin/sessions?useIndex=true&limit=20&cursor=${cursor}`;

      const res = await fetch(url);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || `Failed to load sessions (status ${res.status})`);
        setSessions([]);
        return;
      }
      const json = await res.json();
      if (json.sessions && Array.isArray(json.sessions)) {
        setSessions(json.sessions);
        setCursor(json.nextCursor || "0");
      }
    } catch (err: unknown) {
      setError("Failed to load sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  async function expireSession() {
    const { sessionKey, userId } = confirmDialog;
    if (!sessionKey) return;

    setIsDeleting(sessionKey);
    try {
      const res = await fetch("/api/admin/sessions/expire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionKey,
          confirm: true,
          reason: `Admin expired via UI - User: ${userId || "Unknown"}`,
        }),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.sessionKey !== sessionKey));
        toast({
          title: "Session Expired",
          description: "Internal session token revoked successfully.",
          variant: "success",
        });
      } else {
        toast({ title: "Error", description: "Failed to expire session", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Connection error", variant: "destructive" });
    } finally {
      setIsDeleting(null);
      setConfirmDialog({ open: false, sessionKey: null, userId: null });
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(searchQuery);
  };

  return (
    <div className="max-w-full mx-auto space-y-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Expire Session"
        description="This will immediately revoke access for this session. The user will need to re-authenticate."
        confirmText="Expire Now"
        variant="destructive"
        onConfirm={expireSession}
      >
        <div className="space-y-3 mt-4 text-[13px] bg-muted/30 p-4 rounded-xl border border-border/40">
           <div className="flex justify-between">
             <span className="text-muted-foreground font-medium">User ID</span>
             <span className="font-mono">{confirmDialog.userId || "System"}</span>
           </div>
           <div className="flex flex-col gap-1">
             <span className="text-muted-foreground font-medium">Session Key</span>
             <span className="font-mono text-[11px] opacity-60 break-all">{confirmDialog.sessionKey}</span>
           </div>
        </div>
      </ConfirmDialog>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="space-y-0">
          <h1 className="text-lg font-semibold tracking-tight">Active Sessions</h1>
          <p className="text-md text-muted-foreground">Manage and monitor active user sessions</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchSessions()} 
          disabled={loading}
          className="rounded-full h-10 px-6 font-medium bg-muted/20 border-none transition-all hover:bg-muted/40"
        >
          {loading ? "Syncing..." : "Refresh"}
        </Button>
      </div>

      <div className="space-y-8">
        <form onSubmit={handleSearch} className="px-1">
          <SearchInput
            placeholder="Search by ID, key, or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <section>
          <SectionHeader>Active Sessions {sessions.length > 0 && `(${sessions.length})`}</SectionHeader>
          <GroupContainer>
            {loading ? (
              <div className="py-20 text-center text-muted-foreground font-medium animate-pulse">Scanning Redis sessions...</div>
            ) : error ? (
              <div className="py-20 text-center text-destructive font-medium px-4">{error}</div>
            ) : sessions.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground/60">No active sessions found</div>
            ) : (
              sessions.map((s, idx) => (
                <ListRow
                  key={`${s.sessionKey}-${idx}`}
                  icon={
                    <div className="bg-muted p-2 rounded-xl">
                       <Activity className="h-5 w-5 text-green-500" />
                    </div>
                  }
                  label={s.userId || "System Session"}
                  secondary={
                    <div className="flex flex-col gap-1.5 mt-1">
                      <span className="font-mono text-[11px] opacity-50 truncate max-w-[200px]">{s.sessionKey}</span>
                      <div className="flex items-center gap-3">
                         {s.destination && (
                           <div className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground/80">
                             <MapPin className="h-3 w-3" /> {s.destination}
                           </div>
                         )}
                         {s.budget !== null && (
                           <div className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground/80">
                             <Wallet className="h-3 w-3" /> ₹{s.budget.toLocaleString()}
                           </div>
                         )}
                      </div>
                    </div>
                  }
                  trailing={
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-muted-foreground/60">
                           <Clock className="h-3 w-3" />
                           <span className="text-[11px] font-mono tracking-tighter">
                             {s.ttlSeconds ? `${Math.floor(s.ttlSeconds/60)}m left` : "∞"}
                           </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmDialog({ open: true, sessionKey: s.sessionKey, userId: s.userId })}
                        disabled={isDeleting === s.sessionKey}
                        className="p-2.5 rounded-full hover:bg-red-50 text-muted-foreground/30 hover:text-red-500 transition-all"
                      >
                         <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  }
                  showChevron={false}
                />
              ))
            )}
          </GroupContainer>
        </section>

        {!loading && sessions.length > 0 && (
          <div className="flex items-center justify-between px-2 pt-2 pb-10">
            <span className="text-sm text-muted-foreground/60 font-medium">Redis Cluster State</span>
            <div className="flex gap-8">
              <button 
                onClick={() => fetchSessions()} 
                className="text-[15px] font-semibold text-primary hover:opacity-70 transition-all"
              >
                Scan Next Cursor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
