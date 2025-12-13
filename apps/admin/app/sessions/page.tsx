"use client";

import React, { useEffect, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ToastContainer, useToast } from "../../components/Toast";
import { Button } from "../../components/ui/button";

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
      // Prefer using the Redis index; API will fall back to SCAN if absent.
      const query = searchTerm || searchQuery;
      const url = query
        ? `/api/admin/sessions/search?query=${encodeURIComponent(query)}&limit=100`
        : `/api/admin/sessions?useIndex=true&limit=20&cursor=${cursor}`;

      console.log("[SessionsPage] Fetching sessions:", { url, query });
      const res = await fetch(url);
      console.log(
        "[SessionsPage] Response status:",
        res.status,
        res.statusText
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(
          json.error || `Failed to load sessions (status ${res.status})`
        );
        setSessions([]);
        setLoading(false);
        return;
      }
      const json = await res.json();
      console.log("[SessionsPage] API response:", json);
      console.log("[SessionsPage] Sessions array:", json.sessions);
      console.log("[SessionsPage] Sessions count:", json.sessions?.length || 0);
      console.log("[SessionsPage] First session sample:", json.sessions?.[0]);

      if (json.sessions && Array.isArray(json.sessions)) {
        setSessions(json.sessions);
        setCursor(json.nextCursor || "0");
      } else {
        console.warn("[SessionsPage] Invalid response structure:", json);
        setSessions([]);
        setError("Invalid response format from API");
      }
    } catch (err: unknown) {
      console.error("[SessionsPage] Fetch error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load sessions";
      setError(errorMessage);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleExpireClick(sessionKey: string, userId: string | null) {
    setConfirmDialog({
      open: true,
      sessionKey,
      userId,
    });
  }

  async function expireSession() {
    const { sessionKey, userId } = confirmDialog;
    if (!sessionKey) return;

    setIsDeleting(sessionKey);
    try {
      const body = {
        sessionKey,
        confirm: true,
        reason: `Admin expired via UI - User: ${userId || "Unknown"}`,
      };
      const res = await fetch("/api/admin/sessions/expire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        // Remove from local state immediately for better UX
        setSessions((prev) => prev.filter((s) => s.sessionKey !== sessionKey));
        // Show success toast
        toast({
          title: "Session Expired",
          description: `Session for user ${userId || "Unknown"} has been successfully expired.`,
          variant: "success",
        });
        // Refresh to get updated list
        await fetchSessions();
      } else {
        const errorMsg = json.error || "Failed to expire session";
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to expire session";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
      setConfirmDialog({ open: false, sessionKey: null, userId: null });
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchSessions(searchQuery);
  }

  function handleClearSearch() {
    setSearchQuery("");
    setCursor("0");
    fetchSessions("");
  }

  // Filter sessions client-side if we have a search query (for instant feedback)
  const filteredSessions = searchQuery
    ? sessions.filter((s) => {
        const query = searchQuery.toLowerCase();
        return (
          s.sessionKey.toLowerCase().includes(query) ||
          (s.userId && s.userId.toLowerCase().includes(query)) ||
          (s.destination && s.destination.toLowerCase().includes(query))
        );
      })
    : sessions;

  return (
    <div className="p-6 space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Expire Session"
        description="Are you sure you want to expire this session? This action will be logged in the admin audit trail."
        confirmText="Expire Session"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={expireSession}
      >
        {confirmDialog.sessionKey && (
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Session:</span>{" "}
              <span className="font-mono text-xs break-all">
                {confirmDialog.sessionKey}
              </span>
            </div>
            <div>
              <span className="font-medium">User:</span>{" "}
              {confirmDialog.userId || "Unknown"}
            </div>
          </div>
        )}
      </ConfirmDialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Active Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor active user sessions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchSessions()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Search by session key, user ID, or destination..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button type="submit" disabled={loading}>
          Search
        </Button>
        {searchQuery && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearSearch}
            disabled={loading}
          >
            Clear
          </Button>
        )}
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading sessions…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {!error && filteredSessions.length === 0 && sessions.length === 0 && (
            <div className="rounded-lg border border-border bg-muted/50 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No sessions found. Ensure Redis has session keys and you are
                signed in as an admin.
              </p>
            </div>
          )}
          {!error && filteredSessions.length === 0 && sessions.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/50 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No sessions match your search query &quot;{searchQuery}&quot;.
              </p>
            </div>
          )}
          {filteredSessions.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
              Showing {filteredSessions.length} {searchQuery ? "matching" : ""}{" "}
              session{filteredSessions.length !== 1 ? "s" : ""}
              {searchQuery &&
                sessions.length > filteredSessions.length &&
                ` (filtered from ${sessions.length} total)`}
            </div>
          )}
          {filteredSessions.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">
                        Session
                      </th>
                      <th className="px-4 py-3 text-left font-medium">User</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Destination
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Budget
                      </th>
                      <th className="px-4 py-3 text-left font-medium">TTL</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((s, index) => (
                      <tr
                        key={`${s.sessionKey}-${index}`}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td
                          className="px-4 py-3 truncate max-w-[240px] font-mono text-xs"
                          title={s.sessionKey}
                        >
                          {s.sessionKey}
                        </td>
                        <td className="px-4 py-3">
                          {s.userId ? (
                            <span className="font-mono text-xs">
                              {s.userId}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {s.destination ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {s.budget !== null && typeof s.budget === "number" ? (
                            <span className="font-medium">
                              ₹{s.budget.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {s.ttlSeconds !== null ? (
                            <span className="font-mono text-xs">
                              {s.ttlSeconds}s
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleExpireClick(s.sessionKey, s.userId)
                            }
                            disabled={isDeleting === s.sessionKey || loading}
                          >
                            {isDeleting === s.sessionKey
                              ? "Expiring..."
                              : "Expire"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
