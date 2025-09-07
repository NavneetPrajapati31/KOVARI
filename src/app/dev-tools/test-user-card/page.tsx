"use client";

import { SoloMatchCard } from "@/features/explore/components/SoloMatchCard";

export default function TravelerCardPreviewPage() {
  const sampleMatch = {
    id: "match_001",
    name: "Aditi Sharma",
    destination: "Manali",
    budget: "₹15,000 - ₹25,000",
    start_date: new Date("2025-07-12"),
    end_date: new Date("2025-07-18"),
    compatibility_score: 85,
    budget_difference: "₹2,000",
    user: {
      userId: "user_001",
      name: "Aditi Sharma",
      age: 27,
      gender: "Female",
      personality: "Adventurous",
      interests: ["Photography", "Hiking", "Backpacking"],
      profession: "Photographer",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      nationality: "Indian",
      smoking: "No",
      drinking: "Occasionally",
      religion: "Hindu",
      languages: ["Hindi", "English"],
      location: { lat: 28.6139, lon: 77.2090 }
    },
    is_solo_match: true
  };

  const handleConnect = async (matchId: string) => {
    alert(`Connect request sent to: ${matchId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-center">
      <SoloMatchCard
        match={sampleMatch}
        onConnect={handleConnect}
      />
    </div>
  );
}
