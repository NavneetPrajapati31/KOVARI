"use client";

import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Image, Spinner } from "@heroui/react";
import Link from "next/link";
import { useToast } from "@/shared/hooks/use-toast";

export interface UserProfile {
  name: string;
  username: string;
  age: string;
  gender: string;
  nationality: string;
  profession: string;
  interests: string[];
  languages: string[];
  bio: string;
  followers: string;
  following: string;
  likes: string;
  coverImage: string;
  profileImage: string;
  posts: { id: number | string; image_url: string }[];
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  userId?: string;
}

export interface UserProfileProps {
  profile: UserProfile;
}

export const UserProfile: React.FC<UserProfileProps> = ({ profile }) => {
  // Dynamic posts array for the feed (now from profile)
  const [activeTab, setActiveTab] = React.useState("Trips");
  const [isFollowing, setIsFollowing] = React.useState(
    profile.isFollowing || false
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [followersCount, setFollowersCount] = React.useState(profile.followers);
  const { toast } = useToast();

  // Debug logging
  console.log("Profile data:", {
    isFollowing: profile.isFollowing,
    isOwnProfile: profile.isOwnProfile,
    userId: profile.userId,
    followers: profile.followers,
  });

  // Additional debug logging for button visibility
  console.log("Button visibility check:", {
    isOwnProfile: profile.isOwnProfile,
    shouldShowOwnButtons: profile.isOwnProfile === true,
    shouldShowOtherButtons: profile.isOwnProfile === false,
  });

  // Sync isFollowing state with profile data
  React.useEffect(() => {
    console.log(
      "useEffect triggered - profile.isFollowing:",
      profile.isFollowing
    );
    setIsFollowing(profile.isFollowing || false);
    setFollowersCount(profile.followers);
  }, [profile.isFollowing, profile.followers]);

  const handleFollowToggle = async () => {
    if (!profile.userId || profile.isOwnProfile) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/follow/${profile.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.action === "followed");

        // Update followers count
        const currentCount = parseInt(followersCount);
        if (data.action === "followed") {
          setFollowersCount(String(currentCount + 1));
          toast({
            title: "Success!",
            description: `You are now following ${profile.name}`,
          });
        } else {
          setFollowersCount(String(Math.max(0, currentCount - 1)));
          toast({
            title: "Unfollowed",
            description: `You have unfollowed ${profile.name}`,
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update follow status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Card className="w-full h-full mx-auto bg-transparent border-none rounded-none gap-4 shadow-none p-5">
        {/* Profile Information Section */}
        <Card className="rounded-none border-none shadow-none bg-transparent p-0">
          <CardContent className="p-0">
            <div className="flex flex-row items-stretch lg:justify-start gap-4">
              {/* Profile Avatar Overlay */}
              <Card className="max-w-[220px] max-h-[220px] p-0 bg-transparent border-none shadow-none rounded-3xl flex overflow-hidden">
                <Image
                  src={
                    profile.profileImage ||
                    "https://images.pexels.com/photos/17071640/pexels-photo-17071640.jpeg"
                  }
                  alt="Profile"
                  className="w-full h-full object-cover rounded-3xl"
                />
              </Card>

              <Card className="flex flex-row rounded-3xl bg-transparent w-full border-1 border-border shadow-none p-6 items-start justify-start">
                {/* Left Info */}
                <div className="flex flex-col items-start justify-start max-w-lg">
                  {/* Name and Badge */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="text-xl font-extrabold text-foreground leading-tight">
                      {profile.name}
                    </h1>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    @{profile.username}
                  </p>
                  {/* Profession */}
                  <div className="text-sm text-muted-foreground font-medium mt-1">
                    {profile.profession}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mt-1">
                    {profile.bio}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex flex-row gap-1.5 mt-4">
                    {profile.isOwnProfile === true ? (
                      // Own profile buttons
                      <>
                        <Link href="/profile/edit">
                          <Button
                            size={"sm"}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg px-6 py-1 text-sm shadow-none focus:ring-0 focus:outline-none"
                          >
                            Edit Profile
                          </Button>
                        </Link>
                        <Link href="/explore">
                          <Button
                            size={"sm"}
                            className="bg-primary-light border border-primary text-primary font-semibold rounded-lg px-6 py-1 text-sm shadow-none focus:ring-0 focus:outline-none"
                          >
                            Explore
                          </Button>
                        </Link>
                      </>
                    ) : (
                      // Other user's profile buttons
                      <>
                        <Button
                          size={"sm"}
                          onClick={handleFollowToggle}
                          disabled={isLoading}
                          className={`font-semibold rounded-lg px-6 py-1 text-sm shadow-none focus:ring-0 focus:outline-none ${
                            isFollowing
                              ? "bg-gray-200 text-muted-foreground hover:bg-gray-300 border-1 border-gray-400"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <Spinner
                                variant="spinner"
                                size="sm"
                                color={isFollowing ? "default" : "secondary"}
                                classNames={{
                                  spinnerBars: isFollowing ? "bg-black" : "",
                                }}
                              />
                            </div>
                          ) : isFollowing ? (
                            "Unfollow"
                          ) : (
                            "Follow"
                          )}
                        </Button>
                        <Link href={"/chat"}>
                          <Button
                            size={"sm"}
                            className="bg-primary-light border border-primary text-primary font-semibold rounded-lg px-6 py-1 text-sm shadow-none focus:ring-0 focus:outline-none"
                          >
                            Message
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side - Badges and Stats */}
                <div className="flex flex-col items-start justify-center gap-8">
                  {/* Stats */}
                  <div className="flex gap-12 items-start">
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground mb-0.5 font-medium">
                        Followers
                      </div>
                      <div className="text-lg font-black text-foreground">
                        {followersCount}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground mb-0.5 font-medium">
                        Following
                      </div>
                      <div className="text-lg font-black text-foreground">
                        {profile.following}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground mb-0.5 font-medium">
                        Likes
                      </div>
                      <div className="text-lg font-black text-foreground">
                        {profile.likes}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card
          aria-label="User details"
          className="w-full h-full rounded-3xl bg-transparent shadow-none p-6 flex flex-col gap-6 border border-border mx-auto"
        >
          {/* Tabs Navigation - Modern Style */}
          <div className="flex gap-x-6">
            {[
              { key: "Trips", label: "Trips" },
              { key: "About", label: "About" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-label={`${tab.label} tab`}
                tabIndex={0}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActiveTab(tab.key);
                }}
                className={
                  `relative pb-2 transition-colors duration-150 text-base focus:outline-none ` +
                  (activeTab === tab.key
                    ? "font-bold text-primary"
                    : "font-normal text-muted-foreground hover:text-black")
                }
                style={{ outline: "none" }}
              >
                <span className="align-middle text-sm">{tab.label}</span>
                {activeTab === tab.key && (
                  <span className="absolute left-0 -bottom-[1px] w-full h-0.5 bg-primary rounded" />
                )}
              </button>
            ))}
          </div>

          <CardContent className="p-0">
            {activeTab === "About" && (
              <div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex flex-col">
                    <dt className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                      Age
                    </dt>
                    <dd className="text-sm text-foreground font-medium">
                      {profile.age}
                    </dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                      Gender
                    </dt>
                    <dd className="text-sm text-foreground font-medium">
                      {profile.gender}
                    </dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                      Nationality
                    </dt>
                    <dd className="text-sm text-foreground font-medium">
                      {profile.nationality}
                    </dd>
                  </div>
                  <div className="flex flex-col">
                    <dt className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                      Profession
                    </dt>
                    <dd className="text-sm text-foreground font-medium">
                      {profile.profession}
                    </dd>
                  </div>
                </dl>
                <Separator className="my-6" />
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                      Interests
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <Badge
                          key={interest}
                          className="rounded-full px-3 py-1 text-xs font-medium bg-primary-light text-primary border border-primary"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                      Languages
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((language) => (
                        <Badge
                          key={language}
                          className="rounded-full px-3 py-1 text-xs font-medium bg-primary-light text-primary border border-primary"
                        >
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "Trips" && (
              <div>
                {profile.posts.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {profile.posts.map((post) => (
                      <div
                        key={post.id}
                        className="aspect-[4/5] bg-muted rounded-3xl overflow-hidden flex items-center justify-center shadow-sm"
                      >
                        <Image
                          src={post.image_url}
                          alt={`Post ${post.id}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No posts yet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This user hasn't shared any posts yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Card>
    </div>
  );
};
