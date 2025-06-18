"use client";

import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <div className="relative flex h-[110vh] sm:h-[90vh] w-full flex-col overflow-hidden bg-background">
        <main className="container mx-auto flex flex-1 flex-col items-center justify-center overflow-hidden px-8">
          <section className="z-20 flex flex-col items-center justify-center gap-[18px] sm:gap-6">
            <Button
              className="h-9 overflow-hidden border-1 border-border bg-primary-foreground shadow-sm px-[18px] py-2 text-small font-normal leading-5 text-default-500"
              endContent={
                <Icon
                  className="flex-none outline-none [&>path]:stroke-[2]"
                  icon="solar:arrow-right-linear"
                  width={20}
                />
              }
              radius="full"
              variant="bordered"
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
              <div className="bg-hero-section-title bg-clip-text text-foreground">
                Connect & Travel <br /> With{" "}
                <span className="bg-gradient-to-b from-primary from-50% to-transparent to-100% bg-clip-text text-transparent">
                  Like-Minded
                </span>{" "}
                People
              </div>
            </div>
            <p className="text-center font-normal leading-7 text-default-500 sm:w-[466px] sm:text-[16px]">
              KOVARI helps you find travel companions, plan itineraries
              together, and discover local events. Join travel groups of people
              heading to the same destination.
            </p>
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Button
                className="h-10 w-[163px] bg-primary px-[16px] py-[10px] text-small font-medium leading-5 text-background"
                radius="full"
                onPress={() => {
                  router.push("/sign-up");
                }}
              >
                Start Planning
              </Button>
              <Button
                className="h-10 w-[163px] border-1 border-border shadow-sm px-[16px] py-[10px] text-small font-medium leading-5"
                endContent={
                  <span className="pointer-events-none flex h-[22px] w-[22px] items-center justify-center rounded-full">
                    <Icon
                      className="text-default-500 [&>path]:stroke-[1.5]"
                      icon="solar:arrow-right-linear"
                      width={16}
                    />
                  </span>
                }
                radius="full"
                variant="bordered"
                onPress={() => {
                  router.push("/explore");
                }}
              >
                Find Travelers
              </Button>
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
    </>
  );
}
