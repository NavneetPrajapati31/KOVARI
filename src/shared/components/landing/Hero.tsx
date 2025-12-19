"use client";

import React, { useCallback } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BUTTON_WIDTH = "w-[170px]";
const BUTTON_HEIGHT = "h-12";
const BUTTON_TEXT_SIZE = "text-small";

const HERO_TITLE_GRADIENT =
  "bg-hero-section-title bg-clip-text text-foreground";
const HERO_SUBTITLE_GRADIENT =
  "bg-gradient-to-b from-primary from-50% to-transparent to-100% bg-clip-text text-transparent";

const HERO_DESCRIPTION =
  "KOVARI helps solo travelers, friends, and small groups match, plan trips together, and explore destinations safely — without chaos or guesswork.";

const HERO_SECTION_CLASSES =
  "z-20 flex flex-col items-center gap-[18px] sm:gap-6 sm:justify-center";

export default function Hero() {
  const router = useRouter();

  const handleStartPlanning = useCallback(() => {
    router.push("/sign-up");
  }, [router]);

  const handleFindTravelers = useCallback(() => {
    router.push("/explore");
  }, [router]);

  return (
    <section className="relative w-full sm:h-[90vh] sm:flex sm:flex-col sm:overflow-hidden overflow-x-hidden bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24">
        <div className={HERO_SECTION_CLASSES}>
          <Button
            className="h-7 bg-card overflow-hidden border-none shadow-sm px-[18px] py-2 text-xs font-normal leading-5 text-default-500 text-foreground"
            // endContent={
            //   <Icon
            //     className="flex-none outline-none [&>path]:stroke-[2]"
            //     icon="solar:arrow-right-linear"
            //     width={20}
            //     aria-label="Arrow right"
            //   />
            // }
            radius="full"
            variant="bordered"
            aria-label="Social Travel, Done Right"
          >
            Plan Trips. Find People. Travel Together.
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
              Connect & Travel <br /> With the <span>Right</span> People
            </div>
          </div>
          <p className="text-foreground text-center font-normal leading-7 text-default-500 sm:w-[482px] sm:text-[17px]">
            {HERO_DESCRIPTION}
          </p>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row mt-1">
            {/* <Link href="/sign-in">
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
            </Link> */}
            <Link href="/waitlist">
              <Button
                className={`${BUTTON_HEIGHT} ${BUTTON_WIDTH} bg-primary text-primary-foreground shadow-sm px-[20px] py-[20px] ${BUTTON_TEXT_SIZE} font-bold text-md leading-5`}
                // endContent={
                //   <span className="pointer-events-none flex h-[22px] w-[22px] items-center justify-center rounded-full">
                //     <Icon
                //       className="text-default-500 [&>path]:stroke-[1.5]"
                //       icon="solar:arrow-right-linear"
                //       width={16}
                //       aria-label="Arrow right"
                //     />
                //   </span>
                // }
                radius="full"
                variant="solid"
                // onPress={handleFindTravelers}
                aria-label="Join Waitlist"
              >
                Join the Waitlist
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
