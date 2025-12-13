'use client';

import React, { useEffect, useState } from "react";

type SessionRow = {
  sessionKey: string;
  userId: string | null;
  createdAt: string | null;
  ttlSeconds: number | null;
  destination: string | null;
  budget: number | null;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string>("0");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
      console.log("[SessionsPage] Response status:", res.status, res.statusText);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || `Failed to load sessions (status ${res.status})`);
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
      const errorMessage = err instanceof Error ? err.message : "Failed to load sessions";
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

  async function expireSession(sessionKey: string, userId: string | null) {
    const confirmed = window.confirm(
      `Are you sure you want to expire this session?\n\nSession: ${sessionKey}\nUser: ${userId || "Unknown"}\n\nThis action will be logged.`
    );
    if (!confirmed) return;
    
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
        // Refresh to get updated list
        await fetchSessions();
      } else {
        setError(json.error || "Failed to expire session");
        alert("Error: " + (json.error || "unknown"));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to expire session";
      setError(errorMessage);
      alert("Error: " + errorMessage);
    } finally {
      setIsDeleting(null);
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Active Sessions</h1>
        <button
          className="rounded bg-gray-200 px-3 py-1 text-sm font-medium hover:bg-gray-300"
          onClick={() => fetchSessions()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Search by session key, user ID, or destination..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-gray-400"
          disabled={loading}
        >
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="rounded bg-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-400"
            disabled={loading}
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-auto">
          {error && (
            <div className="mb-2 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {!error && filteredSessions.length === 0 && sessions.length === 0 && (
            <div className="mb-2 text-sm text-gray-600">
              No sessions found. Ensure Redis has session keys and you are signed in as an admin.
            </div>
          )}
          {!error && filteredSessions.length === 0 && sessions.length > 0 && (
            <div className="mb-2 text-sm text-gray-600">
              No sessions match your search query &quot;{searchQuery}&quot;.
            </div>
          )}
          {filteredSessions.length > 0 && (
            <div className="mb-2 text-sm text-gray-600">
              Showing {filteredSessions.length} {searchQuery ? "matching" : ""} session{filteredSessions.length !== 1 ? "s" : ""}
              {searchQuery && sessions.length > filteredSessions.length && ` (filtered from ${sessions.length} total)`}
            </div>
          )}
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="text-left bg-gray-100">
                <th className="px-3 py-2 border-b">Session</th>
                <th className="px-3 py-2 border-b">User</th>
                <th className="px-3 py-2 border-b">Dest</th>
                <th className="px-3 py-2 border-b">Budget</th>
                <th className="px-3 py-2 border-b">TTL</th>
                <th className="px-3 py-2 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => (
                <tr key={s.sessionKey} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 truncate max-w-[240px]" title={s.sessionKey}>
                    {s.sessionKey}
                  </td>
                  <td className="px-3 py-2">{s.userId ?? "—"}</td>
                  <td className="px-3 py-2">{s.destination ?? "—"}</td>
                  <td className="px-3 py-2">
                    {s.budget !== null ? `₹${s.budget.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {s.ttlSeconds !== null ? `${s.ttlSeconds}s` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded bg-red-500 px-3 py-1 text-white text-xs hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => expireSession(s.sessionKey, s.userId)}
                      disabled={isDeleting === s.sessionKey || loading}
                      title={`Delete session for user: ${s.userId || "Unknown"}`}
                    >
                      {isDeleting === s.sessionKey ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

