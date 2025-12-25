"use client";

import React, { useCallback } from "react";
import * as Sentry from "@sentry/nextjs";
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
  "z-20 flex flex-col items-center gap-[28px] sm:gap-6 sm:justify-center";

interface HeroProps {
  onJoinWaitlist?: () => void;
}

export default function Hero({ onJoinWaitlist }: HeroProps) {
  const router = useRouter();

  const handleStartPlanning = useCallback(() => {
    router.push("/sign-up");
  }, [router]);

  const handleFindTravelers = useCallback(() => {
    router.push("/explore");
  }, [router]);

  const handleJoinWaitlist = useCallback(() => {
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Join the Waitlist Button Click",
      },
      (span) => {
        span.setAttribute("button_location", "hero");
        span.setAttribute("action", "open_waitlist_modal");

        if (onJoinWaitlist) {
          onJoinWaitlist();
        } else {
          router.push("/waitlist");
        }
      }
    );
  }, [onJoinWaitlist, router]);

  return (
    <section className="relative w-full sm:flex sm:flex-col sm:overflow-hidden overflow-x-hidden bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 pt-24 pb-16 sm:py-20 md:py-24">
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
            <Button
              className="h-12 sm:h-14 bg-primary text-primary-foreground shadow-sm px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-bold leading-5 w-full sm:w-auto"
              radius="full"
              variant="solid"
              aria-label="Join the Waitlist"
              onPress={handleJoinWaitlist}
            >
              Join the Waitlist
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
