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
    <section className="py-24">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
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
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            Why Choose KOVARI
          </h2>

          {/* Subheading */}
          <p className="text-muted-foreground max-w-md mx-auto">
            Built for travelers who want more than WhatsApp groups and shared
            docs.
          </p>
        </div>

        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative rounded-3xl bg-card p-8 flex flex-col h-full"
                >
                  {/* Icon container */}
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <IconComponent className="h-5 w-5" />
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1 flex flex-col space-y-3">
                    <h3 className="text-lg font-semibold leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
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
