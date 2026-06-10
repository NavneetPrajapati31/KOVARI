import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingContent from "@/shared/components/landing/LandingContent";

export async function generateMetadata() {
  return {
    title: "Kovari | Connect & Travel With the Right People",
    description: "Kovari helps you plan trips, build travel groups, and find companions who match your travel style. Join the waitlist.",
    alternates: {
      canonical: "https://kovari.in",
    },
  };
}
export default async function HomePage() {
  const { userId } = await auth();
  
  if (userId) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}

