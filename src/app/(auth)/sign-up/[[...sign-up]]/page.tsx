import AuthForm from "@/features/auth/components/auth-form";
import HeroSection from "@/features/auth/components/hero-section";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your free KOVARI account today. Instantly connect with verified travelers, discover active travel circles, and start planning your next trip.",
};

export default function SignUpPage() {
  return (
    <div className="h-screen flex items-center">
      {/* Left Column - Auth Form */}
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-full p-6 flex items-center justify-center">
          <AuthForm mode="sign-up" />
        </div>
      </div>

      {/* Right Column - Hero Image & Testimonial */}
      {/* <HeroSection /> */}
    </div>
  );
}
