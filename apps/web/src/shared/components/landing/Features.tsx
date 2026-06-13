"use client";

import React from "react";
import { motion } from "framer-motion";

function GeminiStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C12 6.5 6.5 12 2 12C6.5 12 12 17.5 12 22C12 17.5 17.5 12 22 12C17.5 12 12 6.5 12 2Z" />
    </svg>
  );
}

export default function Features() {
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 1, y: 0 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    },
  };

  return (
    <section id="features" className="relative py-14 md:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-6 md:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* Eyebrow label */}
          <span className="text-[10px] tracking-[0.25em] text-muted-foreground/80 uppercase mb-3 font-mono inline-block">
            CORE FEATURES
          </span>

          {/* Main heading */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-4">
            The operating system for shared journeys.
          </h2>

          {/* Subheading */}
          <p className="text-sm md:text-base text-muted-foreground font-light max-w-lg mx-auto leading-relaxed mb-12 text-center">
            Replacing scattered apps, chaotic docs, and unread spreadsheets with live, actionable collaboration.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="grid grid-cols-12 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Bento Card 1: Shared Itinerary (Large - 8 col, min-h-[280px]) */}
            <motion.div
              variants={itemVariants}
              className="group relative rounded-xl border border-border bg-card p-4 md:p-6 flex flex-col justify-between col-span-12 sm:col-span-6 md:col-span-8 min-h-[140px] md:min-h-[300px] hover:border-primary/20 transition-colors duration-300 overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <GeminiStar className="h-6 w-6 text-muted-foreground" />
                {/* Visual Itinerary illustration */}
                <div className="w-1/2 max-w-[240px] bg-secondary/60 border border-border rounded-xl p-3 space-y-2 text-[10px] sm:text-xs text-muted-foreground select-none shadow-md transform translate-x-0 translate-y-2 group-hover:translate-x-2 transition-transform duration-500">
                  <div className="flex items-center justify-between border-b border-border pb-1.5 mb-1.5">
                    <span className="font-semibold text-foreground">Goa Itinerary</span>
                    <span className="text-primary font-semibold">Day 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/90 font-light">17:30 - Vagator Sunset Meetup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/90 font-light">20:30 - Beach Shack Dinner</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-[15px] sm:text-base font-semibold text-foreground">
                  A single canvas for plans and timelines
                </h3>
                <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground font-light max-w-xl">
                  Leave messy sheets behind. Collaborate on dynamic, consensus-based timelines, propose stops, coordinate flights, and split expenses instantly in a clean, central dashboard.
                </p>
              </div>
            </motion.div>

            {/* Bento Card 2: Style alignment (Small - 4 col, min-h-[160px]) */}
            <motion.div
              variants={itemVariants}
              className="group relative rounded-xl border border-border/50 bg-card p-4 md:p-6 flex flex-col justify-between col-span-12 sm:col-span-6 md:col-span-4 min-h-[140px] md:min-h-[300px] hover:border-primary/20 transition-colors duration-300"
            >
              <div className="flex items-center justify-between">
                <GeminiStar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-[15px] sm:text-base font-semibold text-foreground">
                  Style alignment
                </h3>
                <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground font-light">
                  Never stress about waking up at dawn while your travel companion sleeps in. Filters for budget limits, travel pace, interests, and personality styles keep you aligned.
                </p>
              </div>
            </motion.div>

            {/* Bento Card 3: Explore (Large - 8 col) */}
            <motion.div
              variants={itemVariants}
              className="group relative rounded-xl border border-border/50 bg-card p-4 md:p-6 flex flex-col justify-between col-span-12 sm:col-span-6 md:col-span-8 min-h-[140px] md:min-h-[300px] hover:border-primary/20 transition-colors duration-300 overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <GeminiStar className="h-6 w-6 text-muted-foreground" />
                {/* Visual: traveler search result card */}
                <div className="w-1/2 max-w-[240px] bg-secondary/60 border border-border rounded-xl p-3 space-y-2 text-[10px] sm:text-xs text-muted-foreground select-none shadow-md transform translate-x-0 translate-y-2 group-hover:translate-x-2 transition-transform duration-500">
                  <div className="flex items-center justify-between border-b border-border pb-1.5 mb-1.5">
                    <span className="font-semibold text-foreground">Rahul S.</span>
                    <span className="text-primary font-semibold">92% Match</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground/90 font-light">Spiti Valley · June 20</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-light">Budget · Backpacker</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-[15px] sm:text-base font-semibold text-foreground">
                  Find people going where you&apos;re going
                </h3>
                <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground font-light max-w-xl">
                  Search for solo travelers or groups headed to your destination. Filter by travel dates, budget, and pace — then connect before the trip starts.
                </p>
              </div>
            </motion.div>

            {/* Bento Card 4: Know before you connect (Small - 4 col, min-h-[160px]) */}
            <motion.div
              variants={itemVariants}
              className="group relative rounded-xl border border-border/50 bg-card p-4 md:p-6 flex flex-col justify-between col-span-12 sm:col-span-6 md:col-span-4 min-h-[140px] md:min-h-[300px] hover:border-primary/20 transition-colors duration-300"
            >
              <div className="flex items-center justify-between">
                <GeminiStar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-[15px] sm:text-base font-semibold text-foreground">
                  Know before you connect
                </h3>
                <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground font-light">
                  See travel style, budget range, languages, and pace before you send a single message.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

