"use client";

import { useState, useEffect } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { signUp, setActive } = useSignUp();
  const router = useRouter();

  // Check if we have an active sign-up
  useEffect(() => {
    if (!signUp) {
      router.push("/sign-up");
    }
  }, [signUp, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!signUp) {
        throw new Error("No active sign-up found");
      }

      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result?.status === "complete" && setActive) {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!signUp) {
        throw new Error("No active sign-up found");
      }

      await signUp.prepareEmailAddressVerification();
      setSuccess("Verification code resent. Please check your email.");
    } catch (err: any) {
      setError(
        err.errors?.[0]?.message || "Failed to resend verification code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 custom-autofill">
      <div className="w-full max-w-md">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          aria-label="Back to sign in"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Back to sign in
        </Link>

        <div className="border border-border rounded-xl bg-card shadow-sm p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" aria-hidden />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Verify your email
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
              We&apos;ve sent a verification code to your email address. Please
              enter it below.
            </p>
          </div>

          {error && (
            <div
              className="mb-6 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="mb-6 p-3 text-sm text-green-700 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg"
              role="status"
            >
              {success}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleVerify}>
            <div className="space-y-2">
              <Label
                htmlFor="code"
                className="text-sm font-medium text-foreground"
              >
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-10 border-border focus:ring-transparent placeholder:text-muted-foreground"
                required
                disabled={isLoading}
                maxLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-primary font-medium hover:underline focus:outline-none focus:underline"
                  disabled={isLoading}
                >
                  Resend
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
