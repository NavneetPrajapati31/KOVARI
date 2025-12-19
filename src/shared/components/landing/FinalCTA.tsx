"use client";

import React from "react";
import { Button } from "@heroui/react";
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="py-28 bg-muted/40">
      <div className="container mx-auto px-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Heading */}
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            Ready to Travel Together?
          </h2>

          {/* Subtext */}
          <p className="text-muted-foreground mb-8">
            Join the waitlist and be among the first to experience KOVARI.
          </p>

          {/* Primary CTA */}
          <Link href="/waitlist">
            <Button
              className="h-14 bg-primary text-primary-foreground shadow-sm px-8 py-6 text-base font-bold leading-5"
              radius="full"
              variant="solid"
              aria-label="Join the Waitlist"
            >
              Join the Waitlist
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
