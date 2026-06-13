"use client";

import React from "react";
import { motion } from "framer-motion";

const audienceCards = [
  {
    title: "The Solo Traveler",
    description:
      "Heading to Spiti solo and need someone to split the cab and the costs? Done a Goa trip where nobody else showed up? You belong here.",
  },
  {
    title: "The Small Circle",
    description:
      "Your group is 2-3 people. You need 1-2 more who won't bail last minute and match your travel style. Not randoms from an Instagram post.",
  },
];

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// Gemini-style 4-pointed star
function GeminiStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C12 6.5 6.5 12 2 12C6.5 12 12 17.5 12 22C12 17.5 17.5 12 22 12C17.5 12 12 6.5 12 2Z" />
    </svg>
  );
}


export default function Audience() {
  return (
    <section className="relative py-14 md:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-[10px] tracking-[0.25em] text-muted-foreground/80 uppercase mb-3 font-mono inline-block">
            WHO IT&apos;S FOR
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-4">
            For travelers who move with intention.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-light max-w-lg mx-auto leading-relaxed mb-12 text-center">
            Whether you&apos;re doing a solo Manali trip or building a circle for Southeast Asia — find people who move at your pace.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {audienceCards.map((card, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative p-5 md:p-6 border border-border bg-card hover:border-primary/20 rounded-xl transition-colors duration-300"
              >
                {/* Gemini star */}
                <div className="mb-5">
                  <GeminiStar className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[15px] sm:text-base font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground font-light">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
