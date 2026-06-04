import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingContent from "@/shared/components/landing/LandingContent";

export default async function HomePage() {
  const { userId } = await auth();
  
  if (userId) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}

