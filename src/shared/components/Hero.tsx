"use client";

import React, { useCallback } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BUTTON_WIDTH = "w-[163px]";
const BUTTON_HEIGHT = "h-10";
const BUTTON_TEXT_SIZE = "text-small";

const HERO_TITLE_GRADIENT =
  "bg-hero-section-title bg-clip-text text-foreground";
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
    <div className="relative flex h-full sm:h-[90vh] w-full flex-col sm:overflow-hidden overflow-x-hidden bg-background">
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center overflow-hidden px-8 py-8 mt-6 sm:mt-0">
        <section className={HERO_SECTION_CLASSES}>
          <Button
            className="h-9 overflow-hidden border-1 border-border shadow-sm px-[18px] py-2 text-small font-normal leading-5 text-default-500"
            endContent={
              <Icon
                className="flex-none outline-none [&>path]:stroke-[2]"
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
          <div className="text-center text-[clamp(40px,10vw,44px)] font-bold leading-[1.2] tracking-tighter sm:text-[64px]">
            {/* 
          NOTE: To use `bg-hero-section-title`, you need to add the following to your tailwind config.
          ```
          backgroundImage: {
            "hero-section-title":
              "linear-gradient(91deg, #FFF 32.88%, rgba(255, 255, 255, 0.40) 99.12%)",
          },
          ```
        */}
            <div className={HERO_TITLE_GRADIENT}>
              Connect & Travel <br /> With{" "}
              <span className={HERO_SUBTITLE_GRADIENT}>Like-Minded</span> People
            </div>
          </div>
          <p className="text-center font-normal leading-7 text-default-500 sm:w-[466px] sm:text-[16px]">
            {HERO_DESCRIPTION}
          </p>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Link href="/sign-in">
              <Button
                className={`${BUTTON_HEIGHT} ${BUTTON_WIDTH} bg-primary px-[16px] py-[10px] ${BUTTON_TEXT_SIZE} font-medium leading-5 text-background`}
                radius="full"
                // onPress={handleStartPlanning}
                aria-label="Start Planning"
              >
                Start Planning
              </Button>
            </Link>
            <Link href="/explore">
              <Button
                className={`${BUTTON_HEIGHT} ${BUTTON_WIDTH} border-1 border-border shadow-sm px-[16px] py-[10px] ${BUTTON_TEXT_SIZE} font-medium leading-5`}
                endContent={
                  <span className="pointer-events-none flex h-[22px] w-[22px] items-center justify-center rounded-full">
                    <Icon
                      className="text-default-500 [&>path]:stroke-[1.5]"
                      icon="solar:arrow-right-linear"
                      width={16}
                      aria-label="Arrow right"
                    />
                  </span>
                }
                radius="full"
                variant="bordered"
                // onPress={handleFindTravelers}
                aria-label="Find Travelers"
              >
                Find Travelers
              </Button>
            </Link>
          </div>
        </section>
        <div className="pointer-events-none absolute inset-0 top-[-25%] z-10 scale-150 select-none sm:scale-125">
          {/**
           * If using in a nextjs project, use next/image instead of <img> in <FadeInImage>.
           * Also pass the following additional props to <FadeInImage>.
           *
           * ```tsx
           * <FadeInImage
           *   fill
           *   priority
           *   // existing code...
           * />
           * ```
           */}
          {/* <FadeInImage
          alt="Gradient background"
          src="https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/backgrounds/bg-gradient.png"
        /> */}
        </div>
      </main>
    </div>
  );
}
