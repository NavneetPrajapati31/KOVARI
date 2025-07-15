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
} from "lucide-react";
import type { User } from "@/features/profile/lib/user"; // Import the User interface
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/hooks/use-toast";

interface UserCardProps {
  user: User;
  type: "followers" | "following";
  onRemove?: (userId: number) => void;
  onUnfollow?: (userId: number) => void;
  onFollowBack?: (userId: number) => void;
}

export default function UserCard({
  user,
  type,
  onRemove,
  onUnfollow,
  onFollowBack,
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
          {type === "followers" && (
            <button
              className={`px-5 py-1.5 text-[10px] sm:text-xs font-medium rounded-lg transition-colors bg-primary text-primary-foreground`}
              onClick={isFollowing ? handleMessage : handleFollowToggle}
              aria-label={isFollowing ? "message" : "follow back"}
              disabled={loadingAction === "follow"}
            >
              {isFollowing
                ? "Message"
                : loadingAction === "follow"
                  ? "Following..."
                  : "Follow Back"}
            </button>
          )}
          {type === "following" && (
            <button
              className={`px-5 py-1.5 text-[10px] sm:text-xs font-medium rounded-lg transition-colors bg-primary text-primary-foreground`}
              onClick={handleMessage}
              aria-label="message"
            >
              Message
            </button>
          )}
          {type === "followers" && (
            <button
              className="hidden md:flex px-5 py-1.5 text-[10px] sm:text-xs text-foreground bg-transparent border border-border rounded-lg"
              onClick={handleRemove}
              aria-label="Remove follower"
              disabled={loadingAction === "remove"}
            >
              {loadingAction === "remove" ? "Removing..." : "Remove"}
            </button>
          )}
          {type === "following" && (
            <button
              className="hidden md:flex px-5 py-1.5 text-[10px] sm:text-xs  text-foreground bg-transparent border border-border rounded-lg"
              onClick={handleUnfollow}
              aria-label="Unfollow"
              disabled={loadingAction === "unfollow"}
            >
              {loadingAction === "unfollow" ? "Unfollowing..." : "Unfollow"}
            </button>
          )}
        </div>
        {/* Dropdown for mobile */}
        <div className="flex md:hidden">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
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
              {type === "followers" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove();
                  }}
                  className="!text-destructive !hover:text-destructive text-[10px] sm:text-xs !bg-transparent !hover:bg-transparent"
                  disabled={loadingAction === "remove"}
                >
                  {/* <UserMinus className="w-4 h-4 mr-2" /> */}
                  {loadingAction === "remove" ? "Removing..." : "Remove"}
                </DropdownMenuItem>
              )}
              {type === "following" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleUnfollow();
                  }}
                  className="!text-destructive !hover:text-destructive text-[10px] sm:text-xs !bg-transparent !hover:bg-transparent"
                  disabled={loadingAction === "unfollow"}
                >
                  {/* <UserX className="w-4 h-4 mr-2" /> */}
                  {loadingAction === "unfollow" ? "Unfollowing..." : "Unfollow"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
