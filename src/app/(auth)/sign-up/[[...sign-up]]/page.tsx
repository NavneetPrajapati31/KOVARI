import AuthForm from "@/features/auth/components/auth-form";
import HeroSection from "@/features/auth/components/hero-section";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | KOVARI",
  description: "Create an account on KOVARI to start connecting with like-minded travelers, joining exciting travel circles, and planning your adventures.",
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
