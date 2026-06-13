"use client";

import React from "react";
import { motion } from "framer-motion";

export default function Problem() {
  const stages = [
    {
      stage: "Phase 01",
      title: "The Instagram DM",
      description: "Found someone going to Spiti.\nThey left you on read.",
    },
    {
      stage: "Phase 02",
      title: "WhatsApp Chaos",
      description: "47 people. 300 messages.\nNobody booked anything.",
    },
    {
      stage: "Phase 03",
      title: "The Shared Notes Nobody Opens",
      description: "Itinerary last updated: 3 weeks ago.\nTrip never happened.",
    },
  ];

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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <section className="relative py-14 md:py-24 lg:py-32 overflow-hidden">

      
      <div className="container mx-auto px-6 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Eyebrow */}
          <span className="text-[10px] tracking-[0.25em] text-muted-foreground/80 uppercase mb-3 font-mono inline-block">
            THE SOLO DILEMMA
          </span>

          {/* Main Heading */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-4 max-w-2xl mx-auto leading-tight">
            The trip never gets cancelled.<br />
            <span className="text-muted-foreground/60">It just quietly disappears.</span>
          </h2>

          {/* Subheading */}
          <p className="text-sm md:text-base text-muted-foreground font-light max-w-lg mx-auto leading-relaxed mb-12 text-center">
            You know exactly how this goes.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {stages.map((stageItem, index) => {
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex flex-col p-4 md:p-6 pt-8 md:pt-8 text-left border border-border bg-card rounded-xl hover:border-primary/20 transition-colors duration-300"
                >
                  <p className="text-[11px] text-muted-foreground/80 uppercase tracking-widest mb-3 font-mono">
                    {stageItem.stage}
                  </p>
                  <h3 className="text-[15px] sm:text-base font-semibold text-foreground mb-3">
                    {stageItem.title}
                  </h3>
                  <p className="text-[15px] sm:text-base text-muted-foreground leading-relaxed font-light whitespace-pre-line">
                    {stageItem.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
