"use client";

import React from "react";
import { Button } from "@heroui/react";

interface FinalCTAProps {
  onJoinWaitlist?: () => void;
}

export default function FinalCTA({ onJoinWaitlist }: FinalCTAProps) {
  return (
    <section className="py-20 sm:py-24 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl mx-auto text-center px-4">
          {/* Heading */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight mb-3 sm:mb-4">
            Ready to Travel Together?
          </h2>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
            Join the waitlist and be among the first to experience KOVARI.
          </p>

          {/* Primary CTA */}
          <Button
            className="h-12 sm:h-14 bg-primary text-primary-foreground shadow-sm px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-bold leading-5 w-full sm:w-auto"
            radius="full"
            variant="solid"
            aria-label="Join the Waitlist"
            onPress={onJoinWaitlist}
          >
            Join the Waitlist
          </Button>
        </div>
      </div>
    </section>
  );
}
