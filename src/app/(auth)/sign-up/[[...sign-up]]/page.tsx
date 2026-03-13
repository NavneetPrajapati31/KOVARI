import AuthForm from "@/features/auth/components/auth-form";
import HeroSection from "@/features/auth/components/hero-section";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your free Kovari account today. Instantly connect with verified travelers, discover active travel circles, and start planning your next trip.",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center">
      {/* Left Column - Auth Form */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full sm:p-6 p-3 flex items-center justify-center">
          <AuthForm mode="sign-up" />
        </div>
      </div>

      {/* Right Column - Hero Image & Testimonial */}
      {/* <HeroSection /> */}
    </div>
  );
}
