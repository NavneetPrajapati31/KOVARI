"use client";

import React from "react";
import Hero from "@/components/Hero";
import { GroupInviteCard } from "@/components/cards/InvitationCard";

export default function HomePage() {
  return (
    <>
      <Hero />
      <GroupInviteCard
        invite={{
          id: "1",
          groupName: "Sample Group",
          creator: { name: "Alice", avatar: "", initials: "A" },
          destination: "Paris",
          dates: "April 20-26, 2025",
          description: "A fun trip to Paris.",
          teamMembers: [{ avatar: "", initials: "B", color: "bg-red-500" },{ avatar: "", initials: "B", color: "bg-red-500" }],
          acceptedCount: 3,
          expiresInDays: 5,
          inviteDate: "Today 26 April 2025"
        }}
        onAccept={() => {}}
        onDecline={() => {}}
      />
    </>
  );
}
