"use client";

import React from "react";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";

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
    // {
    //   number: 4,
    //   title: "Travel with Confidence",
    //   description:
    //     "Explore with confidence, knowing you're traveling with people you trust.",
    // },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    },
  };

  return (
    <section id="how-it-works" className="py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-6 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-14 md:mb-16"
        >
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight mb-3 sm:mb-4 px-4">
            Plan, Match, and Travel — Together
          </h2>

          {/* Subheading */}
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
            A simple flow designed to help you find the right people and plan
            better trips.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Steps container with visual flow connection */}
          <div className="relative">
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 relative"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="group relative rounded-3xl bg-card p-6 sm:p-8 text-center flex flex-col h-full border border-transparent hover:border-border/50 hover:shadow-sm"
                >
                  {/* Step number - circular container at top center */}
                  <div className="mx-auto mb-4 sm:mb-6 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-primary-light text-xs sm:text-sm font-medium text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    {step.number}
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1 flex flex-col space-y-2 sm:space-y-3">
                    <h3 className="text-base sm:text-lg font-medium leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
