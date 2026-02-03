"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Loader2,
  Mail,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Inbox,
} from "lucide-react";

type ForgotPasswordStep =
  | "initial"
  | "email_sent"
  | "set_password"
  | "password_set";

const MIN_PASSWORD_LENGTH = 8;

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = useMemo(
    () => (searchParams.get("token") ?? "").trim(),
    [searchParams]
  );

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState<ForgotPasswordStep>(() =>
    tokenFromUrl ? "set_password" : "initial"
  );

  useEffect(() => {
    if (tokenFromUrl && step === "initial") {
      setStep("set_password");
    }
  }, [tokenFromUrl, step]);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to send reset link. Please try again.");
        return;
      }

      setSuccess(
        "If that email is registered, you will receive a reset link shortly."
      );
      setStep("email_sent");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenFromUrl;
    if (!token) {
      setError("Reset link is invalid. Please request a new one.");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to reset password. Please try again.");
        return;
      }

      setSuccess("Your password has been reset. Redirecting to sign in...");
      setStep("password_set");
      setTimeout(() => router.replace("/sign-in"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const token = tokenFromUrl;
  const isSetPasswordStep = step === "set_password" && !!token;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 custom-autofill">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          aria-label="Back to sign in"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Back to sign in
        </Link>

        {/* Card - matches auth form styling */}
        <div className="border border-border rounded-xl bg-card shadow-sm p-8 sm:p-10">
          {/* Step icon + title */}
          <div className="text-center mb-8">
            {step === "initial" || (step === "set_password" && !token) ? (
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" aria-hidden />
              </div>
            ) : step === "email_sent" ? (
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Inbox className="w-6 h-6 text-primary" aria-hidden />
              </div>
            ) : step === "set_password" && token ? (
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6 text-primary" aria-hidden />
              </div>
            ) : (
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle2
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  aria-hidden
                />
              </div>
            )}
            <h1 className="text-xl font-bold text-foreground">
              {step === "set_password" && token
                ? "Set new password"
                : step === "email_sent"
                  ? "Check your email"
                  : step === "password_set"
                    ? "You’re all set"
                    : "Reset your password"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
              {(step === "initial" || (step === "set_password" && !token)) &&
                "Enter your email and we’ll send you a link to reset your password."}
              {step === "email_sent" &&
                "We sent a reset link to your email. The link expires in 1 hour."}
              {step === "set_password" &&
                token &&
                "Choose a new password. This link can only be used once."}
              {step === "password_set" &&
                "Your password has been updated. Redirecting you to sign in."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Success message - only on initial/form steps, not on email_sent (that step has its own copy) */}
          {success && step !== "password_set" && step !== "email_sent" && (
            <div
              className="mb-6 p-3 text-sm text-green-700 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg"
              role="status"
            >
              {success}
            </div>
          )}

          {/* Form: Request reset link */}
          {(step === "initial" || (step === "set_password" && !token)) && (
            <form onSubmit={handleSendResetLink} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 border-border focus:ring-transparent placeholder:text-muted-foreground"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="w-4 h-4 mr-2 animate-spin"
                      aria-hidden
                    />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          )}

          {/* Email sent state */}
          {step === "email_sent" && (
            <div className="text-center space-y-6 pt-2">
              <p className="text-sm text-muted-foreground">
                Can’t find it? Check spam, or{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline focus:outline-none focus:underline"
                  onClick={() => {
                    setStep("initial");
                    setSuccess("");
                  }}
                >
                  send another link
                </button>
                .
              </p>
            </div>
          )}

          {/* Form: Set new password */}
          {isSetPasswordStep && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-sm font-medium text-foreground"
                >
                  New password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 border-border focus:ring-transparent placeholder:text-muted-foreground"
                  required
                  disabled={isLoading}
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                disabled={
                  isLoading ||
                  !newPassword ||
                  newPassword.length < MIN_PASSWORD_LENGTH
                }
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="w-4 h-4 mr-2 animate-spin"
                      aria-hidden
                    />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}

          {/* Success + redirect */}
          {step === "password_set" && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Redirecting you to sign in...
              </p>
              <div className="flex justify-center">
                <Loader2
                  className="w-5 h-5 animate-spin text-muted-foreground"
                  aria-hidden
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
