"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { GroupContainer } from "./ui/ios/GroupContainer";
import { ListRow } from "./ui/ios/ListRow";
import { SectionHeader } from "./ui/ios/SectionHeader";
import { SearchInput } from "./ui/ios/SearchInput";
import { StatusBadge } from "./ui/ios/StatusBadge";
import { getThumbnailUrl } from "../lib/cloudinary-client";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Users, MapPin, Calendar, AlertTriangle, Trash2, Eye } from "lucide-react";

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

  return (
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="px-1">
        <SearchInput
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => {
            setQuery("");
            fetchUsers(1, "");
          }}
        />
        <button type="submit" className="hidden" />
      </form>

      <div className="space-y-2">
        <SectionHeader>All Users</SectionHeader>
        <GroupContainer shadow={false}>
          {users.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground/60 text-[15px]">
              No users found
            </div>
          ) : (
            users.map((user) => {
              const statusElements = [];
              if (user.users?.banned) {
                statusElements.push(user.users.ban_expires_at ? "Suspended" : "Banned");
              }
              if (user.verified) {
                statusElements.push("Verified");
              }
              if (user.deleted) {
                statusElements.push("Deleted");
              }

              return (
                <ListRow
                  key={user.id}
                  onClick={() => router.push(`/users/${user.id}`)}
                  icon={
                    <div className={cn("h-9 w-9 rounded-full overflow-hidden border-none shadow-none flex-shrink-0", user.deleted && "opacity-50")}>
                      <Avatar className="h-full w-full rounded-full">
                        <AvatarImage 
                          src={user.profile_photo ? getThumbnailUrl(user.profile_photo) : ""} 
                          alt={user.name || "User"} 
                          className="object-cover" 
                        />
                        <AvatarFallback className="rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                          {user.name?.substring(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  }
                  label={user.name || "Unknown User"}
                  secondary={user.email}
                  trailing={
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-1">
                        {statusElements.length > 0 && (
                          <StatusBadge status={statusElements[0]} />
                        )}
                        {user.flag_count > 0 && (
                          <StatusBadge status={`${user.flag_count} Flags`} />
                        )}
                      </div>
                    </div>
                  }
                />
              );
            })
          )}
        </GroupContainer>
      </div>

      <div className="flex items-center justify-between px-2 pt-2 pb-10">
        <span className="text-sm text-muted-foreground/60 font-medium">Page {page}</span>
        <div className="flex gap-6">
          <button
            onClick={() => fetchUsers(page - 1, query)}
            disabled={page === 1 || isLoading}
            className="text-[15px] font-medium text-primary disabled:opacity-30 transition-opacity hover:opacity-70 active:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => fetchUsers(page + 1, query)}
            disabled={users.length < initialLimit || isLoading}
            className="text-[15px] font-medium text-primary disabled:opacity-30 transition-opacity hover:opacity-70 active:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
