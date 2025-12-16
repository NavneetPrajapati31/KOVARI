"use client";

import React from "react";
import Hero from "@/shared/components/Hero";
import TopPicksSection from "@/shared/components/TopPicksSection";
import { getAllDestinations } from "@/lib/data/topPicksDestinations";

export default function HomePage() {
  // Get all top picks destinations
  const allDestinations = getAllDestinations();

  return (
    <div className="min-h-screen">
      <Hero />
      
      {/* Top Picks Section */}
      <TopPicksSection 
        destinations={allDestinations}
        className="bg-gray-50"
      />
    </div>
  );
}
