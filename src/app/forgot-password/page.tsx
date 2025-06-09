"use client";

import type React from "react";
import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp, setActive } = useSignUp();
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signUp?.attemptEmailAddressVerification({
        code,
      });

      if (result?.status === "complete" && setActive) {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <div className="w-6 h-6 text-primary-foreground">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-semibold text-primary">KOVARI</span>
          </div> */}
          <h2 className="text-center text-2xl font-bold text-foreground">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            We&apos;ve sent a verification code to your email address. Please
            enter it below.
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
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
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 h-11 border-border focus:ring-transparent placeholder:text-muted-foreground placeholder:text-sm"
              required
              disabled={isLoading}
              maxLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
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
        </form>
      </div>
    </div>
  );
}
