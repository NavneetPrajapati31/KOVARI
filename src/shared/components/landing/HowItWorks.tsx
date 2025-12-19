"use client";

import React from "react";
import { Button } from "@heroui/react";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Choose Your Destination",
      description:
        "Tell us where you're going and when — whether traveling solo or with others.",
    },
    {
      number: 2,
      title: "Find the Right People",
      description:
        "Get matched with travelers or create a small circle that fits your style.",
    },
    {
      number: 3,
      title: "Plan Together",
      description:
        "Collaborate on itineraries, ideas, and plans together — all in one place.",
    },
    {
      number: 4,
      title: "Travel with Confidence",
      description:
        "Explore with confidence, knowing you're traveling with people you trust.",
    },
  ];

  return (
    <section className="py-24 bg-muted/20">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          {/* Eyebrow label */}
          <Button
            className="h-7 bg-card overflow-hidden border-none shadow-sm px-[18px] py-2 text-xs font-normal leading-5 text-default-500 text-foreground mb-3"
            radius="full"
            variant="bordered"
            aria-label="How It Works"
          >
            HOW IT WORKS
          </Button>

          {/* Main heading */}
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            Plan, Match, and Travel — Together
          </h2>

          {/* Subheading */}
          <p className="text-muted-foreground max-w-md mx-auto">
            A simple flow designed to help you find the right people and plan
            better trips.
          </p>
        </div>

        <div className="max-w-8xl mx-auto">
          {/* Steps container with visual flow connection */}
          <div className="relative">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4 relative">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="group relative rounded-3xl bg-card p-8 text-center flex flex-col h-full"
                >
                  {/* Step number - circular container at top center */}
                  <div className="mx-auto mb-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                    {step.number}
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1 flex flex-col space-y-3">
                    <h3 className="text-lg font-semibold leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
