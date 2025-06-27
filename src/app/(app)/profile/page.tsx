"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Bell, MessageSquare, Upload, Plus, Camera, Edit } from "lucide-react";

interface UserProfile {
  name: string;
  username: string;
  age: string;
  gender: string;
  nationality: string;
  profession: string;
  interests: string[];
  languages: string[];
  bio: string;
  location: string;
  followers: string;
  following: string;
  likes: string;
  coverImage: string;
  profileImage: string;
}

export default function ProfilePage() {
  const [profile] = useState<UserProfile>({
    name: "Sarah Johnson",
    username: "@sarahjohnson",
    age: "28",
    gender: "Female",
    nationality: "American",
    profession: "UX/UI Designer & Developer",
    interests: ["Design", "Photography", "Travel", "Coffee", "Art"],
    languages: ["English", "Spanish", "French"],
    bio: "Passionate designer creating meaningful digital experiences. I love turning complex problems into simple, beautiful solutions that users enjoy.",
    location: "San Francisco, CA",
    followers: "2,847",
    following: "156",
    likes: "1,234",
    coverImage:
      "https://drive.google.com/file/d/1ZzqUBgv3QD9vT-8jnYEJDhEjUr_pHtmV/view?usp=sharing",
    profileImage:
      "https://images.pexels.com/photos/1821095/pexels-photo-1821095.jpeg",
  });

  const [activeTab, setActiveTab] = useState("About");

  return (
    <div className="min-h-screen bg-transparent">
      {/* Main Content */}
      <Card className="w-full h-full mx-auto bg-transparent border-none rounded-none gap-4 shadow-none">
        {/* Cover Image Section */}
        {/* <Card className="rounded-none border-x-0 border-t-0 py-0">
          <CardContent className="p-0 relative">
            <div className="h-[150px] bg-[radial-gradient(circle_404px_at_20.3%_15.9%,_rgba(0,79,255,1)_0%,_rgba(0,240,255,1)_90%)] relative overflow-hidden">
              <img
                src={
                  profile.coverImage ||
                  "https://drive.google.com/file/d/1ZzqUBgv3QD9vT-8jnYEJDhEjUr_pHtmV/view?usp=sharing"
                }
                alt=""
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </CardContent>
        </Card> */}

        {/* Profile Information Section */}
        <Card className="rounded-none border-none shadow-none bg-transparent py-0">
          <CardContent className="px-6 py-0">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-start gap-3">
              {/* Profile Avatar Overlay */}
              <div className="relative">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-[195px] h-[195px] rounded-3xl overflow-hidden bg-muted shadow-sm relative">
                    <img
                      src="https://images.pexels.com/photos/8528645/pexels-photo-8528645.jpeg"
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <Card className="flex flex-row rounded-3xl bg-transparent w-full border-1 border-border p-6 items-start justify-start">
                {/* Left Info */}
                <div className="flex flex-col items-start justify-start max-w-lg">
                  {/* Name and Badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold text-foreground leading-tight">
                      {profile.name}
                    </h1>
                  </div>
                  {/* Profession */}
                  <div className="text-sm text-muted-foreground font-medium mt-1">
                    {profile.profession}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mt-1">
                    {profile.bio}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex flex-row gap-1.5 mt-4">
                    <Button
                      size={"sm"}
                      className="bg-primary text-primary-foreground font-semibold rounded-lg px-6 py-1 text-sm shadow-none focus:ring-0 focus:outline-none"
                    >
                      Follow
                    </Button>
                    <Button
                      variant="outline"
                      size={"sm"}
                      className="border border-foreground text-foreground font-semibold rounded-lg px-6 py-1 text-sm shadow-none focus:ring-0 focus:outline-none"
                    >
                      Get in touch
                    </Button>
                  </div>
                </div>

                {/* Right Side - Badges and Stats */}
                <div className="flex flex-col items-start justify-center gap-8">
                  {/* Stats */}
                  <div className="flex gap-12 items-start">
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground mb-1 font-medium">
                        Followers
                      </div>
                      <div className="text-xl font-black text-foreground">
                        {profile.followers}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground mb-1 font-medium">
                        Following
                      </div>
                      <div className="text-xl font-black text-foreground">
                        {profile.following}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground mb-1 font-medium">
                        Likes
                      </div>
                      <div className="text-xl font-black text-foreground">
                        {profile.likes}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      </Card>
    </div>
  );
}
