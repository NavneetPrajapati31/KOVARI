"use client";

import { useState } from "react";
import { useEffect } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
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
} from "lucide-react";
import type { User } from "@/features/profile/lib/user"; // Import the User interface
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks/use-toast";
import { Spinner } from "@heroui/react";

interface UserCardProps {
  user: User;
  type: "followers" | "following";
  onRemove?: (userId: number) => void;
  onUnfollow?: (userId: number) => void;
  onFollowBack?: (userId: number) => void;
  isOwnProfile?: boolean;
  currentUserUuid?: string;
}

export default function UserCard({
  user,
  type,
  onRemove,
  onUnfollow,
  onFollowBack,
  isOwnProfile,
  currentUserUuid,
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
    <div className="flex items-center justify-between pl-4 md:pr-4 pr-3 py-3 hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <Avatar className="sm:w-11 sm:h-11 h-10 w-10 border border-gray-200">
          <AvatarImage
            src={user.avatar || "/placeholder.svg"}
            alt={user.name}
          />
          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
            {getInitials(user.name)}
          </AvatarFallback>
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
      </div>

      <div className="flex items-center space-x-2 ml-3">
        {/* Inline actions for desktop */}
        <div className="flex items-center space-x-2">
          {isOwnProfile && type === "followers" && (
            <button
              className={`w-20 sm:w-24 px-5 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors bg-primary text-primary-foreground flex justify-center items-center`}
              onClick={isFollowing ? handleMessage : handleFollowToggle}
              aria-label={isFollowing ? "message" : "follow back"}
              disabled={loadingAction === "follow"}
            >
              {isFollowing ? (
                "Message"
              ) : loadingAction === "follow" ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                "Follow Back"
              )}
            </button>
          )}
          {isOwnProfile && type === "followers" && (
            <>
              <button
                className={`w-20 sm:w-24 px-5 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors bg-primary text-primary-foreground`}
                onClick={handleMessage}
                aria-label={"message"}
              >
                Message
              </button>
              <button
                className="w-20 sm:w-24 hidden md:flex px-5 py-1.5 text-[10px] sm:text-xs text-foreground bg-transparent border border-border rounded-md justify-center items-center"
                onClick={handleRemove}
                aria-label="Remove follower"
                disabled={loadingAction === "remove"}
              >
                {loadingAction === "remove" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  "Remove"
                )}
              </button>
            </>
          )}
          {isOwnProfile && type === "following" && (
            <>
              <button
                className={`w-20 sm:w-24 px-5 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors bg-primary text-primary-foreground`}
                onClick={handleMessage}
                aria-label={"message"}
              >
                Message
              </button>
              <button
                className="w-20 sm:w-24 hidden md:flex px-5 py-1.5 text-[10px] sm:text-xs  text-foreground bg-transparent border border-border rounded-md justify-center items-center"
                onClick={handleUnfollow}
                aria-label="Unfollow"
                disabled={loadingAction === "unfollow"}
              >
                {loadingAction === "unfollow" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  "Unfollow"
                )}
              </button>
            </>
          )}
          {/* For other profiles: show follow/message logic */}
          {!isOwnProfile &&
            String(user.id) !== currentUserUuid &&
            (user.isFollowing ? (
              <button
                className={`w-20 sm:w-24 px-5 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors bg-primary text-primary-foreground`}
                onClick={handleMessage}
                aria-label="message"
              >
                Message
              </button>
            ) : (
              <button
                className={`w-20 sm:w-24 px-5 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-colors bg-primary text-primary-foreground flex justify-center items-center`}
                onClick={handleFollow}
                aria-label="follow"
                disabled={loadingAction === "follow"}
              >
                {loadingAction === "follow" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  "Follow"
                )}
              </button>
            ))}
        </div>
        {/* Dropdown for mobile */}
        {isOwnProfile && (
          <div className="flex md:hidden">
            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenuTrigger asChild className="!px-0">
                <Button
                  size="sm"
                  className="w-4 h-4 p-0 bg-transparent text-foreground"
                >
                  <EllipsisVertical className="w-4 h-4 text-foreground" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 shadow-sm bg-white/50 backdrop-blur-md"
              >
                {isOwnProfile && type === "followers" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove();
                    }}
                    className="!text-destructive !hover:text-destructive text-[10px] sm:text-xs !bg-transparent !hover:bg-transparent"
                    disabled={loadingAction === "remove"}
                  >
                    {loadingAction === "remove" ? "Removing..." : "Remove"}
                  </DropdownMenuItem>
                )}
                {isOwnProfile && type === "following" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      handleUnfollow();
                    }}
                    className="!text-destructive !hover:text-destructive text-[10px] sm:text-xs !bg-transparent !hover:bg-transparent"
                    disabled={loadingAction === "unfollow"}
                  >
                    {loadingAction === "unfollow"
                      ? "Unfollowing..."
                      : "Unfollow"}
                  </DropdownMenuItem>
                )}
                {/* For other profiles: show follow/message logic in dropdown */}
                {!isOwnProfile &&
                  (user.isFollowing ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleMessage();
                      }}
                      className="text-[10px] sm:text-xs"
                    >
                      Message
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleFollow();
                      }}
                      className="text-[10px] sm:text-xs"
                      disabled={loadingAction === "follow"}
                    >
                      {loadingAction === "follow" ? "Following..." : "Follow"}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
