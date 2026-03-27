"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Hero from "@/shared/components/landing/Hero";
import { getAllDestinations } from "@/lib/data/topPicksDestinations";
import { trackEvent } from "@kovari/utils";

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
  const [waitlistSource, setWaitlistSource] = useState("unknown");

  const openWaitlist = (source: string) => {
    trackEvent("waitlist_click", { source });
    setWaitlistSource(source);
    setIsWaitlistModalOpen(true);
  };

  // Track page view on mount
  useEffect(() => {
    trackEvent("landing_view");
    Sentry.startSpan(
      {
        op: "navigation",
        name: "Landing Page View",
      },
      (span) => {
        span.setAttribute("page", "landing");
        span.setAttribute("path", "/");
      }
    );
  }, []);

  return (
    <div className="min-h-screen font-sans">
      <Hero onJoinWaitlist={() => openWaitlist("hero_cta")} />

      {/* Who Kovari Is For Section */}
      <Audience />

      {/* How Kovari Works Section */}
      <HowItWorks />

      {/* Core Features Section */}
      <Features />

      {/* Safety & Trust Section */}
      <Safety />

      {/* Final CTA Section */}
      <FinalCTA onJoinWaitlist={() => openWaitlist("final_cta")} />

      {/* Footer */}
      <Footer />

      {/* Top Picks Section */}
      {/* <TopPicksSection destinations={allDestinations} className="bg-gray-50" /> */}

      {/* Waitlist Modal */}
      <WaitlistModal
        open={isWaitlistModalOpen}
        onOpenChange={setIsWaitlistModalOpen}
        source={waitlistSource}
      />
    </div>
  );
}

