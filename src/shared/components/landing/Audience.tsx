"use client";

import React from "react";
import { User, Users, Compass } from "lucide-react";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";

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
        "Create or join curated groups of 2–10 people that match your travel style and pace.",
    },
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
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" as const }
    },
  };

  return (
    <section className="relative py-16 sm:py-20 md:py-24">
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
            aria-label="Social Travel, Done Right"
          >
            WHO IT&apos;S FOR
          </Button>

          {/* Main heading */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight mb-3 sm:mb-4">
            Travel Your Way — Together
          </h2>

          {/* Subheading */}
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto px-4">
            Designed for different ways people travel — alone or together.
          </p>
        </motion.div>

        <div className="max-w-8xl mx-auto">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {audienceCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="group relative rounded-3xl bg-card p-6 sm:p-8 border border-transparent hover:border-border/50 hover:shadow-sm"
                >
                  {/* Icon container */}
                  <div className="mb-4 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary-light text-primary group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  {/* Title and Description */}
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="text-base sm:text-lg font-medium">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
