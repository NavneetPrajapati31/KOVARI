"use client";

import { GroupCard } from "@/features/explore/components/GroupCard";
import { addDays } from "date-fns";

export default function GroupCardPreviewPage() {
  const today = new Date();
  const nextWeek = addDays(today, 7);

  const sampleGroup = {
    id: "group_001",
    name: "Ladakh Road Trip",
    destination: "Leh, Ladakh",
    dateRange: {
      start: today,
      end: nextWeek,
      isOngoing: false,
    },
    privacy: "public" as "public" | "private" | "invite-only", // Try "private", "invite-only"
    memberCount: 4,
    userStatus: null as
      | "member"
      | "pending"
      | "pending_request"
      | "blocked"
      | "declined"
      | null,
    creator: {
      name: "Aman Verma",
      username: "amanverma",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
  };

  const handleAction = async (
    groupId: string,
    action: "join" | "request" | "view"
  ) => {
    alert(`Action: ${action} on group ${groupId}`);
    await new Promise((r) => setTimeout(r, 1500)); // Simulate network delay
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
      <GroupCard group={sampleGroup} onAction={handleAction} />
    </main>
  );
}
