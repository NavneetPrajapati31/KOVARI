"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useParams } from "next/navigation";
import UserList from "@/features/profile/components/user-list";
import { ArrowLeft, Search, X } from "lucide-react";
import type { User } from "@/features/profile/lib/user";
import Link from "next/link";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";

export default function FollowersFollowing() {
  const searchParams = useSearchParams();
  const params = useParams();
  const userId = params?.userId as string;
  // Get current user from auth store
  const currentUser = useAuthStore((state) => state.user);
  // State for mapped app user UUID
  const [currentUserUuid, setCurrentUserUuid] = useState<string | null>(null);
  useEffect(() => {
    if (currentUser?.id) {
      getUserUuidByClerkId(currentUser.id).then(setCurrentUserUuid);
    }
  }, [currentUser?.id]);
  // Determine if this is the user's own profile
  const isOwnProfile = currentUserUuid === userId;
  const tabParam = searchParams.get("tab");
  const validTabs = ["followers", "following", "likes"];
  const initialTab = validTabs.includes(tabParam || "")
    ? tabParam!
    : "followers";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string>("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [likesLoading, setLikesLoading] = useState(false);
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtered lists
  const filteredFollowers = useMemo(() => {
    if (!searchQuery.trim()) return followers;
    return followers.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [followers, searchQuery]);

  const filteredFollowing = useMemo(() => {
    if (!searchQuery.trim()) return following;
    return following.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [following, searchQuery]);

  // Search handlers
  const handleSearch = () => {
    inputRef.current?.focus();
  };
  const handleClearSearch = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // Memoized fetch for followers
  const fetchFollowers = async (force = false) => {
    if (!userId) return;
    if (followers.length > 0 && !force) return;
    setFollowersLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile/${userId}/followers`);
      if (!res.ok) throw new Error("Failed to fetch followers");
      const data = await res.json();
      setFollowers(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setFollowersLoading(false);
    }
  };

  // Memoized fetch for following
  const fetchFollowing = async (force = false) => {
    if (!userId) return;
    if (following.length > 0 && !force) return;
    setFollowingLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile/${userId}/following`);
      if (!res.ok) throw new Error("Failed to fetch following");
      const data = await res.json();
      setFollowing(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setFollowingLoading(false);
    }
  };

  // Fetch on tab switch, but only if not already loaded
  useEffect(() => {
    if (activeTab === "followers") {
      fetchFollowers();
    } else {
      fetchFollowing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeTab]);

  // Sync tab with query param on mount or when tabParam changes
  useEffect(() => {
    if (validTabs.includes(tabParam || "")) {
      setActiveTab(tabParam!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // Fetch profile username on mount or when userId changes
  useEffect(() => {
    if (!userId) return;
    setProfileLoading(true);
    setProfileError(null);
    fetch(`/api/profile/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => {
        setProfileUsername(data.username || "");
      })
      .catch((err) => {
        setProfileError(err.message || "Unknown error");
      })
      .finally(() => setProfileLoading(false));
  }, [userId]);

  // Fetch likes count when likes tab is active
  useEffect(() => {
    if (activeTab !== "likes" || !userId) return;
    setLikesLoading(false);
    setError(null);
    fetch(`/api/profile/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => {
        setLikes(Number(data.likes) || 0);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
      })
      .finally(() => setLikesLoading(false));
  }, [activeTab, userId]);

  // Handlers (stubbed for now)
  const handleRemoveFollower = async (userId: number) => {
    // TODO: Implement backend call
    setFollowers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleUnfollow = async (userId: number) => {
    // TODO: Implement backend call
    setFollowing((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleFollowBack = async (userId: number) => {
    // TODO: Implement backend call
    setFollowers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
      )
    );
  };

  return (
    <div className="w-full bg-card min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-card z-10">
        <div className="flex items-center justify-start gap-4 sm:justify-between sm:gap-0 p-4">
          <Link href={"/profile"}>
            <ArrowLeft className="sm:w-5 sm:h-5 w-4 h-4 text-foreground" />
          </Link>
          <h1 className="text-xs sm:text-sm font-semibold text-foreground">
            {profileLoading && (
              <span className="text-muted-foreground">Loading...</span>
            )}
            {profileError && <span className="text-destructive">Error</span>}
            {!profileLoading && !profileError && profileUsername}
          </h1>
          <div className="w-5 h-5"></div>
        </div>
        {/* Custom Tabs */}
        <div
          className="flex w-full bg-card h-12 p-0 m-0 shadow-none border-b border-border"
          role="tablist"
          aria-label="Followers and Following Tabs"
        >
          <button
            type="button"
            role="tab"
            // eslint-disable-next-line jsx-a11y/aria-proptypes
            aria-selected={activeTab === "followers" ? "true" : "false"}
            tabIndex={activeTab === "followers" ? 0 : -1}
            onClick={() => setActiveTab("followers")}
            onKeyDown={(e) => {
              if (
                (e.key === "Enter" || e.key === " ") &&
                activeTab !== "followers"
              )
                setActiveTab("followers");
            }}
            className={`relative flex-1 flex justify-center items-center bg-transparent pb-2 transition-colors duration-150 text-sm focus:outline-none font-medium text-muted-foreground ${activeTab === "followers" ? "!font-extrabold text-primary" : ""}`}
          >
            <span className="align-middle text-xs sm:text-sm">
              {followers.length} followers
            </span>
            {activeTab === "followers" && (
              <span className="absolute left-0 -bottom-[1px] w-full h-0.5 bg-primary rounded" />
            )}
          </button>
          <button
            type="button"
            role="tab"
            // eslint-disable-next-line jsx-a11y/aria-proptypes
            aria-selected={activeTab === "following" ? "true" : "false"}
            tabIndex={activeTab === "following" ? 0 : -1}
            onClick={() => setActiveTab("following")}
            onKeyDown={(e) => {
              if (
                (e.key === "Enter" || e.key === " ") &&
                activeTab !== "following"
              )
                setActiveTab("following");
            }}
            className={`relative flex-1 flex justify-center items-center bg-transparent pb-2 transition-colors duration-150 text-sm focus:outline-none font-medium text-muted-foreground ${activeTab === "following" ? "!font-extrabold text-primary" : ""}`}
          >
            <span className="align-middle text-xs sm:text-sm">
              {following.length} following
            </span>
            {activeTab === "following" && (
              <span className="absolute left-0 -bottom-[1px] w-full h-0.5 bg-primary rounded" />
            )}
          </button>
          <button
            type="button"
            role="tab"
            // eslint-disable-next-line jsx-a11y/aria-proptypes
            aria-selected={activeTab === "likes" ? "true" : "false"}
            tabIndex={activeTab === "likes" ? 0 : -1}
            onClick={() => setActiveTab("likes")}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && activeTab !== "likes")
                setActiveTab("likes");
            }}
            className={`relative flex-1 flex justify-center items-center bg-transparent pb-2 transition-colors duration-150 text-sm focus:outline-none font-medium text-muted-foreground ${activeTab === "likes" ? "!font-extrabold text-primary" : ""}`}
          >
            <span className="align-middle text-xs sm:text-sm">
              {likes} likes
            </span>
            {activeTab === "likes" && (
              <span className="absolute left-0 -bottom-[1px] w-full h-0.5 bg-primary rounded" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 bg-card flex-shrink-0 border-b border-border">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-4 pr-12 py-2 bg-gray-100 border-0 rounded-md text-muted-foreground placeholder:text-gray-400 text-sm placeholder:text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search followers or following"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            ref={inputRef}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              tabIndex={0}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Search"
              tabIndex={0}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Search className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "followers" && followersLoading && (
          <div className="flex justify-center items-center py-8">
            <span className="text-muted-foreground text-xs sm:text-sm">
              Loading...
            </span>
          </div>
        )}
        {activeTab === "following" && followingLoading && (
          <div className="flex justify-center items-center py-8">
            <span className="text-muted-foreground text-xs sm:text-sm">
              Loading...
            </span>
          </div>
        )}
        {activeTab === "likes" && likesLoading && (
          <div className="flex justify-center items-center py-8">
            <span className="text-muted-foreground text-xs sm:text-sm">
              Loading...
            </span>
          </div>
        )}
        {activeTab === "likes" && !likesLoading && !error && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-gray-400 text-center">
              <h3 className="text-xs sm:text-sm font-medium text-foreground mb-2">
                {likes} likes
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {likes === 0
                  ? "No likes yet. When you get likes, you'll see them here."
                  : "This is a placeholder for likes content."}
              </p>
            </div>
          </div>
        )}
        {!followersLoading && !error && activeTab === "followers" && (
          <UserList
            users={filteredFollowers}
            type="followers"
            onRemove={handleRemoveFollower}
            onFollowBack={handleFollowBack}
            isOwnProfile={isOwnProfile}
            currentUserUuid={currentUserUuid || undefined}
          />
        )}
        {!followingLoading && !error && activeTab === "following" && (
          <UserList
            users={filteredFollowing}
            type="following"
            onUnfollow={handleUnfollow}
            isOwnProfile={isOwnProfile}
            currentUserUuid={currentUserUuid || undefined}
          />
        )}
      </div>
    </div>
  );
}
