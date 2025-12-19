"use client";

import React from "react";
import { User, Users, Compass } from "lucide-react";
import { Button } from "@heroui/react";

export default function Audience() {
  const audienceCards = [
    {
      icon: User,
      title: "Solo Travelers",
      description:
        "Find people heading to the same destination and build trusted travel circles — without awkward DMs.",
    },
    {
      icon: Users,
      title: "Friends & Groups",
      description:
        "Plan trips together, stay aligned, and avoid the chaos of scattered messages and plans.",
    },
    {
      icon: Compass,
      title: "Small Travel Circles",
      description:
        "Create or join curated groups of 2–6 people that match your travel style and pace.",
    },
  ];

  return (
    <section className="relative py-24 bg-muted/40">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          {/* Eyebrow label */}
          <Button
            className="h-7 bg-card overflow-hidden border-none shadow-sm px-[18px] py-2 text-xs font-normal leading-5 text-default-500 text-foreground mb-3"
            // endContent={
            //   <Icon
            //     className="flex-none outline-none [&>path]:stroke-[2]"
            //     icon="solar:arrow-right-linear"
            //     width={20}
            //     aria-label="Arrow right"
            //   />
            // }
            radius="full"
            variant="bordered"
            aria-label="Social Travel, Done Right"
          >
            WHO IT'S FOR
          </Button>

          {/* Main heading */}
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            Travel Your Way — Together
          </h2>

          {/* Subheading */}
          <p className="text-muted-foreground max-w-lg mx-auto">
            Designed for different ways people travel — alone or together.
          </p>
        </div>

        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {audienceCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={index}
                  className="group relative rounded-3xl bg-card p-8"
                >
                  {/* Icon container */}
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <IconComponent className="h-5 w-5" />
                  </div>

                  {/* Title and Description */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {card.description}
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
