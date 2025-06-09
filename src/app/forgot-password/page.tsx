"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// Define a type for the steps in the password reset flow
type ForgotPasswordStep = "initial" | "code_sent" | "password_set";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState<ForgotPasswordStep>("initial"); // State to control the flow step
  const [signInAttempt, setSignInAttempt] = useState<any>(null); // To store the Clerk signIn object
  const { client, signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  // Prevent navigation during redirect
  useEffect(() => {
    if (isRedirecting && pathname !== "/forgot-password") {
      router.replace("/forgot-password");
    }
  }, [isRedirecting, pathname, router]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Initiate the password reset flow with Clerk
      const clerkSignInAttempt = await client.signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setSignInAttempt(clerkSignInAttempt);
      setSuccess("Verification code has been sent to your email address.");
      setStep("code_sent"); // Move to the next step
    } catch (err: any) {
      console.error("Error during send code:", err);
      setError(
        err.errors?.[0]?.message ||
          "Failed to send verification code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!signInAttempt) {
        setError("Verification flow not initiated. Please start over.");
        return;
      }

      // Attempt to complete the password reset with the code and new password
      const result = await signInAttempt.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete") {
        // Don't create a session, just show success and redirect
        setSuccess(
          "Password has been reset successfully. Please sign in with your new password."
        );
        setStep("password_set"); // Final step
        setIsRedirecting(true);

        // Show success message for 3 seconds before signing out and redirecting
        setTimeout(async () => {
          try {
            // Sign out without automatic redirect
            await signOut({ redirectUrl: undefined });
            router.replace("/sign-in");
          } catch (error) {
            console.error("Error during sign out:", error);
            router.replace("/sign-in");
          }
        }, 3000);
      } else {
        // This case should ideally not be hit if status is 'needs_new_password'
        // during verification and 'complete' during final reset.
        setError("Unexpected reset status. Please try again.");
        console.error("Unexpected reset status:", result);
      }
    } catch (err: any) {
      console.error("Error during password reset:", err);
      setError(
        err.errors?.[0]?.message ||
          "Failed to reset password. Please check your code and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-8 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4">
        <div>
          <h2 className="text-center text-2xl font-bold text-foreground">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {step === "initial" &&
              "Enter your email address to receive a verification code."}
            {step === "code_sent" &&
              "Enter the verification code sent to your email and your new password."}
            {step === "password_set" && "Your password has been reset."}
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-[#dc2626]/15 border border-[#dc2626] rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-green-600 bg-green-100 border border-green-600 rounded-md">
            {success}
          </div>
        )}

        {/* Show loading state during redirect */}
        {isRedirecting && (
          <div className="flex justify-center items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Redirecting to sign in...
            </span>
          </div>
        )}

        {/* Only show forms if not redirecting */}
        {!isRedirecting && (
          <>
            {/* Render form based on step */}
            {step === "initial" && (
              <form className="mt-8 space-y-4" onSubmit={handleSendCode}>
                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 h-11 border-border focus:ring-transparent placeholder:text-muted-foreground placeholder:text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </form>
            )}

            {step === "code_sent" && (
              <form className="mt-8 space-y-4" onSubmit={handleResetPassword}>
                <div>
                  <Label
                    htmlFor="code"
                    className="text-sm font-medium text-foreground"
                  >
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 h-11 border-border focus:ring-transparent placeholder:text-muted-foreground placeholder:text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="newPassword"
                    className="text-sm font-medium text-foreground"
                  >
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 h-11 border-border focus:ring-transparent placeholder:text-muted-foreground placeholder:text-sm"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                  disabled={
                    isLoading || !code || !newPassword || newPassword.length < 8
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            {step === "password_set" && (
              <div className="mt-8 space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  You will be redirected to the sign-in page shortly.
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-foreground hover:underline font-medium"
                onClick={() => router.push("/sign-in")}
              >
                Back to Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
