"use client";

import { useState } from "react";
import { useEffect } from "react";
import {
  Avatar,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { UserAvatarFallback } from "@/shared/components/UserAvatarFallback";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  UserMinus,
  Flag,
  UserX,
  EllipsisVertical,
  Loader2,
  X,
} from "lucide-react";

import type { User } from "@/features/profile/lib/user"; // Import the User interface
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks/use-toast";
import { Spinner } from "@heroui/react";
import Link from "next/link";

interface UserCardProps {
  user: User;
  type: "followers" | "following";
  onRemove?: (userId: number) => void;
  onUnfollow?: (userId: number) => void;
  onFollowBack?: (userId: number) => void;
  isOwnProfile?: boolean;
  currentUserUuid?: string;
  profileLink?: string;
}

export default function UserCard({
  user,
  type,
  onRemove,
  onUnfollow,
  onFollowBack,
  isOwnProfile,
  currentUserUuid,
  profileLink,
}: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState<boolean>(
    user.isFollowing || false
  );
  const [loadingAction, setLoadingAction] = useState<
    null | "remove" | "unfollow" | "follow"
  >(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Sync local isFollowing state with prop
  useEffect(() => {
    setIsFollowing(user.isFollowing || false);
  }, [user.isFollowing]);

  // API: Remove follower
  const removeFollower = async (userId: number) => {
    setLoadingAction("remove");
    setIsDropdownOpen(true);
    try {
      const res = await fetch(`/api/profile/${userId}/followers/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove follower");
      if (onRemove) onRemove(userId);
      toast({
        title: "Removed follower",
        description: `User removed from your followers.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
      setIsDropdownOpen(false);
    }
  };

  // API: Unfollow user
  const unfollowUser = async (userId: number) => {
    setLoadingAction("unfollow");
    setIsDropdownOpen(true);
    try {
      const res = await fetch(`/api/profile/${userId}/following/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unfollow user");
      setIsFollowing(false);
      if (onUnfollow) onUnfollow(userId);
      toast({
        title: "Unfollowed",
        description: `You have unfollowed this user.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
      setIsDropdownOpen(false);
    }
  };

  // API: Follow user (Follow Back)
  const followUser = async (userId: number) => {
    setLoadingAction("follow");
    try {
      const res = await fetch(`/api/profile/${userId}/followers/`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to follow user");
      setIsFollowing(true);
      if (onFollowBack) onFollowBack(userId);
      toast({
        title: "Followed",
        description: `You are now following this user.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Add a handler for following a user from another profile
  const handleFollow = async () => {
    setLoadingAction("follow");
    try {
      const res = await fetch(`/api/profile/${user.id}/followers/`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to follow user");
      setIsFollowing(true);
      toast({
        title: "Followed",
        description: `You are now following this user.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFollowToggle = () => {
    if (isFollowing) return; // Already following
    followUser(user.id);
  };

  const handleRemove = () => {
    removeFollower(user.id);
  };

  const handleUnfollow = () => {
    unfollowUser(user.id);
  };

  const handleMessage = () => {
    router.push(`/chat/${user.id}`);
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between pl-4 md:pr-4 pr-3 py-3 transition-colors">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {profileLink ? (
          <Link
            href={profileLink}
            className="flex items-center space-x-3 min-w-0 group focus:outline-none"
            tabIndex={0}
            aria-label={`View ${user.name}'s profile`}
          >
            <Avatar className="sm:w-11 sm:h-11 h-10 w-10">
              <AvatarImage
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
              />
<UserAvatarFallback />
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col">
                <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate">
                  {user.name}
                </span>
                <span className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  {user.username}
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <>
            <Avatar className="sm:w-11 sm:h-11 h-10 w-10">
              <AvatarImage
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
              />
<UserAvatarFallback />
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col">
                <span className="text-[11px] sm:text-xs font-semibold text-foreground truncate">
                  {user.name}
                </span>
                <span className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  {user.username}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center space-x-2 ml-3">
        {/* Inline actions for desktop */}
        <div className="flex items-center space-x-2">
          {isOwnProfile && type === "followers" && (
            <>
              <Button
                className="h-8 px-4 text-[11px] sm:text-xs font-medium bg-primary text-primary-foreground rounded-lg min-w-[90px]"
                onClick={isFollowing ? handleMessage : handleFollowToggle}
                disabled={loadingAction === "follow"}
              >
                {loadingAction === "follow" ? (
                  <Spinner variant="spinner" size="sm" classNames={{spinnerBars: "bg-primary-foreground"}} />
                ) : isFollowing ? (
                  "Message"
                ) : (
                  "Follow Back"
                )}
              </Button>
              <Button
                size="sm"
                className="hidden md:flex h-8 px-4 text-xs font-medium bg-secondary text-foreground rounded-lg min-w-[80px]"
                onClick={handleRemove}
                disabled={loadingAction === "remove"}
              >
                {loadingAction === "remove" ? (
                  <Spinner variant="spinner" size="sm" classNames={{spinnerBars: "bg-foreground"}} />
                ) : (
                  "Remove"
                )}
              </Button>
            </>
          )}
          {isOwnProfile && type === "following" && (
            <>
              <Button
                size="sm"
                className="h-8 px-4 text-[11px] sm:text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg min-w-[90px]"
                onClick={handleMessage}
              >
                Message
              </Button>
              <Button
                size="sm"
                className="hidden md:flex h-8 px-4 text-[11px] sm:text-xs font-medium bg-secondary text-foreground rounded-lg min-w-[80px]"
                onClick={handleUnfollow}
                disabled={loadingAction === "unfollow"}
              >
                {loadingAction === "unfollow" ? (
                  <Spinner variant="spinner" size="sm" classNames={{spinnerBars: "bg-foreground"}} />
                ) : (
                  "Unfollow"
                )}
              </Button>
            </>
          )}
          {/* For other profiles: show follow/message logic */}
          {!isOwnProfile && String(user.id) !== currentUserUuid && (
            <Button
              size="sm"
              className={`h-8 px-4 text-[11px] sm:text-xs font-medium rounded-lg min-w-[90px] ${
                isFollowing
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
              onClick={isFollowing ? handleMessage : handleFollow}
              disabled={loadingAction === "follow"}
            >
              {loadingAction === "follow" ? (
                <Spinner
                  variant="spinner"
                  size="sm"
                  classNames={{ spinnerBars: "bg-primary-foreground" }}
                />
              ) : isFollowing ? (
                "Message"
              ) : (
                "Follow"
              )}
            </Button>
          )}
        </div>
        {/* Dropdown for mobile */}
        {/* Dropdown for mobile */}
        {isOwnProfile && (
          <div className="flex md:hidden items-center ml-1">
            {type === "followers" ? (
              <Button
                size="sm"
                className="w-8 h-8 bg-secondary text-foreground rounded-lg"
                onClick={handleRemove}
                disabled={loadingAction === "remove"}
              >
                {loadingAction === "remove" ? (
                  <Spinner
                    variant="spinner"
                    size="sm"
                    classNames={{ spinnerBars: "bg-foreground" }}
                  />
                ) : (
                  <X className="w-5 h-5" />
                )}
                <span className="sr-only">Remove</span>
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-8 h-8 bg-secondary text-foreground rounded-lg"
                onClick={handleUnfollow}
                disabled={loadingAction === "unfollow"}
              >
                {loadingAction === "unfollow" ? (
                  <Spinner
                    variant="spinner"
                    size="sm"
                    classNames={{ spinnerBars: "bg-foreground" }}
                  />
                ) : (
                  <X className="w-5 h-5" />
                )}
                <span className="sr-only">Unfollow</span>
              </Button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
