"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Hero from "@/shared/components/landing/Hero";
import { getAllDestinations } from "@/lib/data/topPicksDestinations";

// Lazy load below-the-fold content to aggressively improve JS parsing and TBT on mobile
const Audience = dynamic(() => import("@/shared/components/landing/Audience"));
const HowItWorks = dynamic(() => import("@/shared/components/landing/HowItWorks"));
const Features = dynamic(() => import("@/shared/components/landing/Features"));
const Safety = dynamic(() => import("@/shared/components/landing/Safety"));
const FinalCTA = dynamic(() => import("@/shared/components/landing/FinalCTA"));
const Footer = dynamic(() => import("@/shared/components/landing/Footer"));
const WaitlistModal = dynamic(() => import("@/shared/components/landing/WaitlistModal"), { ssr: false });

export default function HomePage() {
  // Get all top picks destinations
  const allDestinations = getAllDestinations();
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  // Track page view on mount
  useEffect(() => {
    Sentry.startSpan(
      {
        op: "navigation",
        name: "Landing Page View",
      },
      (span) => {
        span.setAttribute("page", "landing");
        span.setAttribute("path", "/landing");
      }
    );
  }, []);

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
