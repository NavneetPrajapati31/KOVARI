"use client";

import React, { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ToastContainer, useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { GroupContainer } from "@/components/ui/ios/GroupContainer";
import { ListRow } from "@/components/ui/ios/ListRow";
import { SectionHeader } from "@/components/ui/ios/SectionHeader";
import { SearchInput } from "@/components/ui/ios/SearchInput";
import { Activity, Clock, Trash2, User, MapPin, Wallet, Loader2, ChevronDown, Copy, Fingerprint, Globe, ShieldCheck, Database, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type SessionRow = {
  sessionKey: string;
  userId: string | null;
  createdAt: string | null;
  ttlSeconds: number | null;
  destination: string | null;
  budget: number | null;
  metadata: Record<string, any> | null;
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
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const toggleSessionExpansion = (key: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(key)) newExpanded.delete(key);
    else newExpanded.add(key);
    setExpandedSessions(newExpanded);
  };

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
    <div className="max-w-full mx-auto space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Expire Session"
        description="This will immediately revoke access for this session. The user will need to re-authenticate."
        confirmText="Expire Now"
        onConfirm={expireSession}
      >
        <div className="space-y-3 mt-4 text-sm bg-card p-4 rounded-lg border border-border">
           <div className="flex justify-between gap-2">
             <span className="text-muted-foreground font-medium">User ID</span>
             <span className="font-mono text-sm break-all line-clamp-1">{confirmDialog.userId || "System"}</span>
           </div>
           <div className="flex justify-between gap-2">
             <span className="text-muted-foreground font-medium">Session Key</span>
             <span className="font-mono text-sm break-all line-clamp-1">{confirmDialog.sessionKey}</span>
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
          className="rounded-lg bg-card h-10 shadow-none disabled:opacity-100"
        >
          {loading ? "Syncing..." : "Refresh"}
        </Button>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSearch} className="">
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
              <div className="h-[60vh] text-center flex items-center text-sm text-muted-foreground justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> Fetching sessions...</div>
            ) : error ? (
              <div className="h-[60vh] text-center flex items-center text-sm text-destructive font-medium px-4">{error}</div>
            ) : sessions.length === 0 ? (
              <div className="h-[60vh] text-center flex items-center text-sm text-muted-foreground justify-center gap-2">No active sessions found</div>
            ) : (
              sessions.map((s, idx) => {
                const isExpanded = expandedSessions.has(s.sessionKey);
                const expiryDate = s.ttlSeconds 
                  ? new Date(Date.now() + s.ttlSeconds * 1000) 
                  : null;

                return (
                  <React.Fragment key={`${s.sessionKey}-${idx}`}>
                    <ListRow
                      onClick={() => toggleSessionExpansion(s.sessionKey)}
                      label={s.userId || "System Session"}
                      secondary={
                        <div className="flex flex-col gap-1.5 mt-1">
                          <div className="flex items-center gap-3">
                             {s.destination && (
                               <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                                 <MapPin className="h-3 w-3" /> {s.destination}
                               </div>
                             )}
                          </div>
                        </div>
                      }
                      trailing={
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDialog({ open: true, sessionKey: s.sessionKey, userId: s.userId });
                            }}
                            disabled={isDeleting === s.sessionKey}
                            className="rounded-lg shadow-none h-8 w-8 p-0"
                          >
                             <Trash2 className="h-4 w-4" />
                          </Button>
                          {/* <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} /> */}
                        </div>
                      }
                      showChevron={false}
                      className={cn("transition-colors", isExpanded && "bg-card")}
                    />
                    {isExpanded && (
                      <div className="px-6 py-5 bg-card border-b border-border space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Session Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                  <Fingerprint className="h-3 w-3" /> Session Key
                                </span>
                                <div className="flex items-center gap-2">
                                   <code className="text-sm bg-background px-2 py-1 rounded border border-border truncate max-w-full">{s.sessionKey}</code>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       navigator.clipboard.writeText(s.sessionKey);
                                       toast({ title: "Copied", description: "Session key copied", variant: "success" });
                                     }}
                                     className="text-xs font-semibold text-primary cursor-pointer flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                   >
                                     COPY
                                   </button>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                  <User className="h-3 w-3" /> User ID
                                </span>
                                <p className="text-sm font-medium text-foreground line-clamp-1">{s.userId || "System / Unauthenticated"}</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3" /> Created At
                                </span>
                                <p className="text-sm font-medium text-foreground">{s.createdAt ? new Date(s.createdAt).toLocaleString() : "N/A"}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                  <ShieldCheck className="h-3 w-3" /> Expiry Time
                                </span>
                                <p className="text-sm font-medium text-foreground">
                                  {expiryDate ? expiryDate.toLocaleString() : "Does not expire"}
                                </p>
                              </div>
                           </div>
                        </div>

                        {/* Metadata JSON */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                              <Database className="h-3 w-3" /> Raw Metadata
                            </span>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigator.clipboard.writeText(JSON.stringify(s.metadata, null, 2));
                                toast({ title: "Copied", description: "Metadata JSON copied", variant: "success" });
                              }}
                              className="text-xs font-semibold text-primary cursor-pointer flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                            > COPY JSON
                            </button>
                          </div>
                          <pre className="text-xs font-mono bg-background p-4 rounded-xl border border-border overflow-auto scrollbar-hide text-muted-foreground max-h-[300px]">
                            {JSON.stringify(s.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </GroupContainer>
        </section>

        {!loading && sessions.length > 0 && (
          <div className="flex items-center justify-between px-2 pt-2 pb-10">
            <span className="text-sm text-muted-foreground font-medium">Redis Cluster State</span>
            <div className="flex gap-8">
              <button 
                onClick={() => fetchSessions()} 
                className="text-sm font-semibold text-primary hover:opacity-70 transition-all"
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
