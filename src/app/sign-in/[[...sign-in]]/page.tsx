import AuthForm from "@/components/auth/auth-form";
import HeroSection from "@/components/auth/hero-section";

export default function SignInPage() {
  return (
    <div className="h-screen flex items-center">
      {/* Left Column - Auth Form */}
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-full max-w-md flex items-center justify-center">
          <AuthForm mode="sign-in" />
        </div>
      </div>

      {/* Right Column - Hero Image & Testimonial */}
      {/* <HeroSection /> */}
    </div>
  );
}
