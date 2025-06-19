"use client";

import { useEffect, useState } from "react";
import TravelerCard from "../cards/TravelerCard";
import { GroupCard } from "../cards/GroupCard";

type UserStatus = "member" | "pending" | "blocked" | null;

// Dummy data for travelers
const dummyTravelers = [
  {
    id: "t1",
    name: "Sarah Johnson",
    username: "sarahj",
    age: 28,
    bio: "Adventure seeker and photography enthusiast. Love exploring new cultures and cuisines.",
    profilePhoto: "https://randomuser.me/api/portraits/women/44.jpg",
    destination: "Bali, Indonesia",
    travelDates: "July 15 - July 30, 2024",
    matchStrength: "high" as const,
  },
  {
    id: "t2",
    name: "Michael Chen",
    username: "mchen",
    age: 32,
    bio: "Backpacker and foodie. Always looking for authentic local experiences.",
    profilePhoto: "https://randomuser.me/api/portraits/men/32.jpg",
    destination: "Tokyo, Japan",
    travelDates: "August 1 - August 15, 2024",
    matchStrength: "medium" as const,
  },
  {
    id: "t3",
    name: "Emma Wilson",
    username: "emma_w",
    age: 25,
    bio: "Solo traveler and yoga instructor. Passionate about sustainable tourism.",
    profilePhoto: "https://randomuser.me/api/portraits/women/68.jpg",
    destination: "Barcelona, Spain",
    travelDates: "September 5 - September 20, 2024",
    matchStrength: "high" as const,
  },
  {
    id: "t4",
    name: "David Kim",
    username: "dkim",
    age: 30,
    bio: "Digital nomad and coffee enthusiast. Love meeting new people while traveling.",
    profilePhoto: "https://randomuser.me/api/portraits/men/75.jpg",
    destination: "Bangkok, Thailand",
    travelDates: "October 10 - October 25, 2024",
    matchStrength: "medium" as const,
  },
  {
    id: "t5",
    name: "Sarah Johnson",
    username: "sarahj",
    age: 28,
    bio: "Adventure seeker and photography enthusiast. Love exploring new cultures and cuisines.",
    profilePhoto: "https://randomuser.me/api/portraits/women/44.jpg",
    destination: "Bali, Indonesia",
    travelDates: "July 15 - July 30, 2024",
    matchStrength: "high" as const,
  },
  {
    id: "t6",
    name: "Michael Chen",
    username: "mchen",
    age: 32,
    bio: "Backpacker and foodie. Always looking for authentic local experiences.",
    profilePhoto: "https://randomuser.me/api/portraits/men/32.jpg",
    destination: "Tokyo, Japan",
    travelDates: "August 1 - August 15, 2024",
    matchStrength: "medium" as const,
  },
  {
    id: "t7",
    name: "Emma Wilson",
    username: "emma_w",
    age: 25,
    bio: "Solo traveler and yoga instructor. Passionate about sustainable tourism.",
    profilePhoto: "https://randomuser.me/api/portraits/women/68.jpg",
    destination: "Barcelona, Spain",
    travelDates: "September 5 - September 20, 2024",
    matchStrength: "high" as const,
  },
  {
    id: "t8",
    name: "David Kim",
    username: "dkim",
    age: 30,
    bio: "Digital nomad and coffee enthusiast. Love meeting new people while traveling.",
    profilePhoto: "https://randomuser.me/api/portraits/men/75.jpg",
    destination: "Bangkok, Thailand",
    travelDates: "October 10 - October 25, 2024",
    matchStrength: "medium" as const,
  },
];

// Dummy data for groups
const dummyGroups = [
  {
    id: "g1",
    name: "Bali Adventure Squad",
    privacy: "public" as const,
    destination: "Bali, Indonesia",
    dateRange: {
      start: new Date("2024-07-15"),
      end: new Date("2024-07-30"),
      isOngoing: false,
    },
    memberCount: 8,
    userStatus: null,
    creator: {
      name: "Sarah Johnson",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
  },
  {
    id: "g2",
    name: "Tokyo Explorers",
    privacy: "private" as const,
    destination: "Tokyo, Japan",
    dateRange: {
      start: new Date("2024-08-01"),
      end: new Date("2024-08-15"),
      isOngoing: false,
    },
    memberCount: 12,
    userStatus: "pending" as UserStatus,
    creator: {
      name: "Michael Chen",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
  },
  {
    id: "g3",
    name: "Barcelona Cultural Tour",
    privacy: "public" as const,
    destination: "Barcelona, Spain",
    dateRange: {
      start: new Date("2024-09-05"),
      end: new Date("2024-09-20"),
      isOngoing: false,
    },
    memberCount: 15,
    userStatus: "member" as UserStatus,
    creator: {
      name: "Emma Wilson",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
  },
  {
    id: "g4",
    name: "Thailand Backpackers",
    privacy: "invite-only" as const,
    destination: "Bangkok, Thailand",
    dateRange: {
      start: new Date("2024-10-10"),
      end: new Date("2024-10-25"),
      isOngoing: false,
    },
    memberCount: 6,
    userStatus: null,
    creator: {
      name: "David Kim",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    },
  },
  {
    id: "g5",
    name: "Bali Adventure Squad",
    privacy: "public" as const,
    destination: "Bali, Indonesia",
    dateRange: {
      start: new Date("2024-07-15"),
      end: new Date("2024-07-30"),
      isOngoing: false,
    },
    memberCount: 8,
    userStatus: null,
    creator: {
      name: "Sarah Johnson",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
  },
  {
    id: "g6",
    name: "Tokyo Explorers",
    privacy: "private" as const,
    destination: "Tokyo, Japan",
    dateRange: {
      start: new Date("2024-08-01"),
      end: new Date("2024-08-15"),
      isOngoing: false,
    },
    memberCount: 12,
    userStatus: "pending" as UserStatus,
    creator: {
      name: "Michael Chen",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
  },
  {
    id: "g7",
    name: "Barcelona Cultural Tour",
    privacy: "public" as const,
    destination: "Barcelona, Spain",
    dateRange: {
      start: new Date("2024-09-05"),
      end: new Date("2024-09-20"),
      isOngoing: false,
    },
    memberCount: 15,
    userStatus: "member" as UserStatus,
    creator: {
      name: "Emma Wilson",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
  },
  {
    id: "g8",
    name: "Thailand Backpackers",
    privacy: "invite-only" as const,
    destination: "Bangkok, Thailand",
    dateRange: {
      start: new Date("2024-10-10"),
      end: new Date("2024-10-25"),
      isOngoing: false,
    },
    memberCount: 6,
    userStatus: null,
    creator: {
      name: "David Kim",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    },
  },
];

interface ExploreResultsProps {
  activeTab: number;
}

export default function ExploreResults({ activeTab }: ExploreResultsProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state when tab changes
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate 1 second loading time

    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleGroupAction = async (
    groupId: string,
    action: "view" | "request" | "join"
  ) => {
    console.log(`Group action: ${action} for group ${groupId}`);
    // Implement actual group action logic here
  };

  return (
    <div className="w-full px-5 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeTab === 0
          ? // Travelers Tab
            dummyTravelers.map((traveler) => (
              <TravelerCard
                key={traveler.id}
                traveler={traveler}
                isLoading={isLoading}
              />
            ))
          : // Groups Tab
            dummyGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onAction={handleGroupAction}
                isLoading={isLoading}
              />
            ))}
      </div>
    </div>
  );
}
