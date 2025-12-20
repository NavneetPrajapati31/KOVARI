"use client";

import React, { useState } from "react";
import Hero from "@/shared/components/landing/Hero";
import Audience from "@/shared/components/landing/Audience";
import HowItWorks from "@/shared/components/landing/HowItWorks";
import Features from "@/shared/components/landing/Features";
import Safety from "@/shared/components/landing/Safety";
import FinalCTA from "@/shared/components/landing/FinalCTA";
import Footer from "@/shared/components/landing/Footer";
import TopPicksSection from "@/shared/components/TopPicksSection";
import WaitlistModal from "@/shared/components/landing/WaitlistModal";
import { getAllDestinations } from "@/lib/data/topPicksDestinations";

export default function HomePage() {
  // Get all top picks destinations
  const allDestinations = getAllDestinations();
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Hero onJoinWaitlist={() => setIsWaitlistModalOpen(true)} />

      {/* Who KOVARI Is For Section */}
      <Audience />

      {/* How KOVARI Works Section */}
      <HowItWorks />

      {/* Core Features Section */}
      <Features />

      {/* Safety & Trust Section */}
      <Safety />

      {/* Final CTA Section */}
      <FinalCTA onJoinWaitlist={() => setIsWaitlistModalOpen(true)} />

      {/* Footer */}
      <Footer />

      {/* Top Picks Section */}
      {/* <TopPicksSection destinations={allDestinations} className="bg-gray-50" /> */}

      {/* Waitlist Modal */}
      <WaitlistModal
        open={isWaitlistModalOpen}
        onOpenChange={setIsWaitlistModalOpen}
      />
    </div>
  );
}
