"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import UserList from "@/features/profile/components/user-list";
import { ArrowLeft } from "lucide-react";
import type { User } from "@/features/profile/lib/user";
import Link from "next/link";

export default function FollowersFollowing() {
  const searchParams = useSearchParams();
  const params = useParams();
  const userId = params?.userId as string;
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
    <div className="w-full bg-transparent min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-transparent z-10">
        <div className="flex items-center justify-start gap-2 sm:justify-between sm:gap-0 p-4">
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
      </div>

      {/* Custom Tabs */}
      <div
        className="flex w-full bg-transparent h-12 p-0 m-0 shadow-none border-b border-border"
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
          <span className="align-middle text-xs sm:text-sm">{likes} likes</span>
          {activeTab === "likes" && (
            <span className="absolute left-0 -bottom-[1px] w-full h-0.5 bg-primary rounded" />
          )}
        </button>
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
            users={followers}
            type="followers"
            onRemove={handleRemoveFollower}
            onFollowBack={handleFollowBack}
          />
        )}
        {!followingLoading && !error && activeTab === "following" && (
          <UserList
            users={following}
            type="following"
            onUnfollow={handleUnfollow}
          />
        )}
      </div>
    </div>
  );
}
