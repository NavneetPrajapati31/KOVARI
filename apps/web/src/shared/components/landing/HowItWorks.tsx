"use client";

import React from "react";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Tell us where you're going",
      description:
        "Your destination, dates, and how you travel. Budget traveler or comfort seeker",
    },
    {
      number: 2,
      title: "Find your people",
      description:
        "We surface travelers going the same way, at the same time, with a similar pace.",
    },
    {
      number: 3,
      title: "Plan it together",
      description:
        "Shared space for routes, stays, and costs. Book together. No more 'I'll send you later'.",
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
      transition: { duration: 0.5, ease: "easeOut" as const }
    },
  };

  return (
    <section id="how-it-works" className="relative py-14 md:py-24 lg:py-32 overflow-hidden">
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
            HOW IT WORKS
          </span>

          {/* Main heading */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-4">
            From a pinned location to a shared coordinate.
          </h2>

          {/* Subheading */}
          <p className="text-sm md:text-base text-muted-foreground font-light max-w-lg mx-auto leading-relaxed mb-12 text-center">
            Three stages of intent. No endless chatting, no guesswork.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Steps container with visual flow connection */}
          <div className="relative">
            {/* Horizontal connecting line desktop */}
            <div className="hidden md:block absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent pointer-events-none" />

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  variants={itemVariants}
                  className="group relative rounded-xl bg-card p-5 md:p-6 border border-border hover:border-primary/20 transition-colors duration-300 text-left md:text-center flex flex-col h-full z-10"
                >
                  {/* Step number - circular container at top center/left */}
                  <div className="mr-auto md:mx-auto mb-6 flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border text-sm sm:text-base font-semibold text-muted-foreground group-hover:border-primary/20 transition-colors z-20">
                    {step.number}
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1 flex flex-col space-y-2">
                    <h3 className="text-[15px] sm:text-base font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground font-light">
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

