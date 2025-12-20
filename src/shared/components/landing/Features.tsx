"use client";

import React from "react";
import { Button } from "@heroui/react";
import { Sparkles, Calendar, Shield } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Sparkles,
      title: "Smart Matching",
      description:
        "Match with travelers based on destination, dates, and travel style — not random profiles or endless DMs.",
    },
    {
      icon: Calendar,
      title: "Plan Together, Stay Aligned",
      description:
        "Collaborate on itineraries, ideas, and plans in one shared space — everyone stays on the same page.",
    },
    {
      icon: Shield,
      title: "Safe, Trusted Travel Circles",
      description:
        "Travel in small, verified groups designed for safety, comfort, and real human connection.",
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-12 sm:mb-14 md:mb-16">
          {/* Eyebrow label */}
          <Button
            className="h-7 bg-card overflow-hidden border-none shadow-sm px-[18px] py-2 text-xs font-normal leading-5 text-default-500 text-foreground mb-3"
            radius="full"
            variant="bordered"
            aria-label="Core Features"
          >
            CORE FEATURES
          </Button>

          {/* Main heading */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight mb-3 sm:mb-4 px-4">
            Why Choose KOVARI
          </h2>

          {/* Subheading */}
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
            Built for travelers who want more than WhatsApp groups and shared
            docs.
          </p>
        </div>

        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative rounded-3xl bg-card p-6 sm:p-8 flex flex-col h-full"
                >
                  {/* Icon container */}
                  <div className="mb-4 sm:mb-6 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1 flex flex-col space-y-2 sm:space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
