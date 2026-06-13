"use client";

import React from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function NotForEveryone() {
  const weAreNot = [
    {
      title: "Not a dating app.",
      desc: "Just find people who actually want to travel.",
    },
    {
      title: "Not a packaged tour.",
      desc: "No fixed 7-day itinerary with a tour uncle.",
    },
    {
      title: "Not another dead group chat.",
      desc: "We're here to actually get people on flights.",
    },
  ];

  const weAre = [
    {
      title: "Destination & vibe matching.",
      desc: "Budget, pace, sleep schedule — aligned first.",
    },
    {
      title: "One place to plan everything.",
      desc: "Flights, stays, cab splits — no scattered DMs.",
    },
    {
      title: "You decide who reaches you.",
      desc: "No random messages. You're always in control.",
    },
  ];

  return (
    <section className="relative py-14 md:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-6 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* Eyebrow */}
          <span className="text-[10px] tracking-[0.25em] text-muted-foreground/80 uppercase mb-3 font-mono inline-block">
            MEMBERSHIP CRITERIA
          </span>

          {/* Main Heading */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-4">
            Not for everyone.
          </h2>

          {/* Subheading */}
          <p className="text-sm md:text-base text-muted-foreground font-light max-w-lg mx-auto leading-relaxed mb-12 text-center">
            Here&apos;s what Kovari is — and what it isn&apos;t.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          {/* Left Column: WE ARE NOT */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="pb-4 border-b border-border">
              <h3 className="text-sm font-semibold tracking-[0.25em] uppercase text-muted-foreground">
                WHAT KOVARI IS NOT
              </h3>
            </div>

            <div className="space-y-8">
              {weAreNot.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-[15px] sm:text-base font-semibold text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-destructive/30" />
                    <span className="line-through">{item.title}</span>
                  </h4>
                  <p className="text-[15px] sm:text-base text-muted-foreground leading-relaxed font-light pl-3">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: WE ARE */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8 mt-8 md:mt-0 md:pl-8"
          >
            <div className="pb-4 border-b border-border">
              <h3 className="text-sm font-semibold tracking-[0.25em] uppercase text-muted-foreground">
                WHAT KOVARI IS
              </h3>
            </div>

            <div className="space-y-8">
              {weAre.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-[15px] sm:text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    {item.title}
                  </h4>
                  <p className="text-[15px] sm:text-base text-foreground leading-relaxed font-light pl-3.5">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
