import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingContent from "@/shared/components/landing/LandingContent";

export default async function HomePage() {
  const { userId } = await auth();
  
  // Auto-redirect to dashboard if signed in, but ONLY if not in waitlist mode.
  // This prevents infinite loops if the user is not a bypass user.
  const isWaitlistMode = 
    process.env.LAUNCH_WAITLIST_MODE === "true" || 
    process.env.LAUNCH_WAITLIST_MODE === "1";

  if (userId && !isWaitlistMode) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}

