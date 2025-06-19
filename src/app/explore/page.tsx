"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ExploreResults from "@/components/explore/ExploreResults";

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab === "groups" ? 1 : 0;
  });

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    const newTab = index === 1 ? "groups" : "travelers";
    router.push(`/explore?tab=${newTab}`, { scroll: false });
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <ExploreHeader activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="w-full flex-1 px-4">
        <ExploreResults activeTab={activeTab} />
      </div>
    </div>
  );
}
