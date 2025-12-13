"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

interface User {
  id: string;
  user_id: string;
  name: string | null;
  email: string;
  profile_photo?: string;
  verified: boolean;
  deleted?: boolean;
  flag_count: number;
  created_at: string;
  users?: {
    banned: boolean;
    ban_reason?: string;
    ban_expires_at?: string;
  };
}

interface AdminUsersTableProps {
  initialUsers: User[];
  initialPage: number;
  initialLimit: number;
  initialQuery?: string;
}

export function AdminUsersTable({
  initialUsers,
  initialPage,
  initialLimit,
  initialQuery = "",
}: AdminUsersTableProps) {
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [page, setPage] = React.useState(initialPage);
  const [query, setQuery] = React.useState(initialQuery);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchUsers = React.useCallback(
    async (newPage: number, searchQuery: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: newPage.toString(),
          limit: initialLimit.toString(),
        });
        if (searchQuery) {
          params.append("query", searchQuery);
        }

        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.users || []);
        setPage(newPage);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [initialLimit]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, query);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Search by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" disabled={isLoading}>
          Search
        </Button>
      </form>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  User
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Email
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
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden",
                            user.deleted && "opacity-50"
                          )}
                        >
                          {user.profile_photo ? (
                            <img
                              src={user.profile_photo}
                              alt={user.name || "User"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {user.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.name || "Unknown User"}
                          </div>
                          {user.deleted && (
                            <div className="text-xs text-muted-foreground">
                              Deleted
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{user.email}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.verified && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                            Verified
                          </span>
                        )}
                        {user.users?.banned && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100">
                            {user.users.ban_expires_at ? "Suspended" : "Banned"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {user.flag_count > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                          {user.flag_count}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/users/${user.id}`)}
                      >
                        Open
                      </Button>
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
            onClick={() => fetchUsers(page - 1, query)}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(page + 1, query)}
            disabled={users.length < initialLimit || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
