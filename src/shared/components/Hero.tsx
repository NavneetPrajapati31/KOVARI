"use client";

import React, { useCallback } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const BUTTON_WIDTH = "w-[163px]";
const BUTTON_HEIGHT = "h-10";
const BUTTON_TEXT_SIZE = "text-sm";

const HERO_TITLE_GRADIENT =
  "bg-hero-section-title bg-clip-text text-accent";
const HERO_SUBTITLE_GRADIENT =
  "bg-gradient-to-b from-primary from-50% to-transparent to-100% bg-clip-text text-transparent";

const HERO_DESCRIPTION =
  "KOVARI helps you find travel companions, plan itineraries together, and discover local events. Join travel groups of people heading to the same destination.";

const HERO_SECTION_CLASSES =
  "z-20 flex flex-col items-center justify-center gap-[18px] sm:gap-6";

export default function Hero() {
  const router = useRouter();

  const handleStartPlanning = useCallback(() => {
    router.push("/sign-up");
  }, [router]);

  const handleFindTravelers = useCallback(() => {
    router.push("/explore");
  }, [router]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background text-textDark scroll-smooth">
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center overflow-hidden px-8 py-8 sm:mt-0">
        <section className={HERO_SECTION_CLASSES}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button
              className="h-9 overflow-hidden border border-accent shadow-sm px-[18px] py-2 text-sm font-normal leading-5 text-accent"
              endContent={
                <Icon
                  className="flex-none outline-none text-accent [&>path]:stroke-[2]"
                  icon="solar:arrow-right-linear"
                  width={20}
                  aria-label="Arrow right"
                />
              }
              radius="full"
              variant="bordered"
              aria-label="Travel Together, Better"
            >
              Travel Together, Better
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center text-[clamp(40px,10vw,44px)] font-bold leading-[1.2] tracking-tighter sm:text-[64px]"
          >
            <div className={HERO_TITLE_GRADIENT}>
              Connect & Travel <br /> With{" "}
              <span className={HERO_SUBTITLE_GRADIENT}>Like-Minded</span> People
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-center font-normal leading-7 text-accent sm:w-[466px] sm:text-[16px]"
          >
            {HERO_DESCRIPTION}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="flex flex-col items-center justify-center gap-6 sm:flex-row"
          >
            <Link href="#start">
              <Button
                className={`${BUTTON_HEIGHT} ${BUTTON_WIDTH} bg-primary hover:bg-primaryHover text-white px-[16px] py-[10px] ${BUTTON_TEXT_SIZE} font-medium leading-5 transition-transform duration-200 hover:scale-105`}
                radius="full"
                aria-label="Start Planning"
              >
                Start Planning
              </Button>
            </Link>
            <Link href="#explore">
              <Button
                className={`${BUTTON_HEIGHT} ${BUTTON_WIDTH} bg-secondary text-white px-[16px] py-[10px] ${BUTTON_TEXT_SIZE} font-medium leading-5 transition-transform duration-200 hover:scale-105`}
                endContent={
                  <span className="pointer-events-none flex h-[22px] w-[22px] items-center justify-center rounded-full">
                    <Icon
                      className="text-white [&>path]:stroke-[1.5]"
                      icon="solar:arrow-right-linear"
                      width={16}
                      aria-label="Arrow right"
                    />
                  </span>
                }
                radius="full"
                aria-label="Find Travelers"
              >
                Find Travelers
              </Button>
            </Link>
          </motion.div>
        </section>
        <div className="pointer-events-none absolute inset-0 top-[-25%] z-10 scale-150 select-none sm:scale-125">
          {/* Optional background image can go here using next/image */}
        </div>
      </main>
    </div>
  );
}
