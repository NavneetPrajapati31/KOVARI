"use client";

import React from "react";
import { Button } from "@heroui/react";
import { UserCheck, Users, ShieldCheck, Lock } from "lucide-react";

export default function Safety() {
  const trustItems = [
    {
      icon: UserCheck,
      title: "Verified Profiles",
      description:
        "Profiles are verified to reduce fake accounts and ensure real, trustworthy connections.",
    },
    {
      icon: Users,
      title: "Small, Curated Groups",
      description:
        "Travel in thoughtfully sized circles — never crowds — designed for comfort and safety.",
    },
    {
      icon: ShieldCheck,
      title: "Community Moderation",
      description:
        "Built-in reporting and moderation tools help keep the community respectful and secure.",
    },
    {
      icon: Lock,
      title: "Privacy by Default",
      description:
        "Your personal information stays protected — you control what you share and with whom.",
    },
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          {/* Eyebrow label */}
          <Button
            className="h-7 bg-card overflow-hidden border-none shadow-sm px-[18px] py-2 text-xs font-normal leading-5 text-default-500 text-foreground mb-3"
            radius="full"
            variant="bordered"
            aria-label="Safety & Trust"
          >
            SAFETY & TRUST
          </Button>

          {/* Main heading */}
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            Travel with Confidence
          </h2>

          {/* Subheading */}
          <p className="text-muted-foreground max-w-md mx-auto">
            Built with safety, privacy, and trust at the core — so you can focus
            on the journey.
          </p>
        </div>

        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustItems.map((item, index) => {
              const IconComponent = item.icon;
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
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.description}
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
