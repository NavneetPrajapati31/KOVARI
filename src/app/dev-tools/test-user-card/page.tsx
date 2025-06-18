"use client";

import TravelerCard from "@/components/card/TravelerCard";

export default function TravelerCardPreviewPage() {
  const sampleTraveler = {
    id: "user_001",
    name: "Aditi Sharma",
    username: "aditi31",
    age: 27,
    destination: "Manali",
    travelDates: "July 12, 2025 – July 18, 2025",
    bio: "Backpacker, photographer, and solo traveler who loves exploring.",
    profilePhoto: "https://randomuser.me/api/portraits/women/44.jpg",
    matchStrength: "high" as "high" | "medium" | "low", // Try "medium" or "low" as well
  };

  const handleConnect = (travelerId: string) => {
    alert(`Connect request sent to: ${travelerId}`);
  };

  const handleViewProfile = (travelerId: string) => {
    alert(`Viewing profile of: ${travelerId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
      <TravelerCard traveler={sampleTraveler} />
    </div>
  );
}
