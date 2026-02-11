"use client";

import React, { useState } from "react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useUser, useReverification } from "@clerk/nextjs";
import {
  isClerkRuntimeError,
  isReverificationCancelledError,
} from "@clerk/nextjs/errors";
import { toast } from "sonner";
import { Loader2, Mail, X } from "lucide-react";
import { Spinner } from "@heroui/react";

export function AccountSection() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    newEmail?: string;
    confirmEmail?: string;
  }>({});
  const [verificationStep, setVerificationStep] = useState(false);
  const [pendingEmailId, setPendingEmailId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  const isMobile = useIsMobile();
  const { user, isLoaded } = useUser();

  const createEmailAddressWithReverification = useReverification(
    (email: string) =>
      user?.createEmailAddress({ email }) ??
      Promise.reject(new Error("Not signed in")),
  );

  const currentEmail =
    user?.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    )?.emailAddress || "";

  const handleCancelEmail = () => {
    setShowEmailForm(false);
    setVerificationStep(false);
    setPendingEmailId(null);
    setNewEmail("");
    setConfirmEmail("");
    setCode("");
    setErrors({});
    setVerifyError("");
    setVerifySuccess("");
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestVerification = async () => {
    setErrors({});

    const newErrors: { newEmail?: string; confirmEmail?: string } = {};
    if (!newEmail.trim()) {
      newErrors.newEmail = "Email is required";
    } else if (!validateEmail(newEmail)) {
      newErrors.newEmail = "Invalid email format";
    }
    if (!confirmEmail.trim()) {
      newErrors.confirmEmail = "Please confirm your email";
    } else if (newEmail !== confirmEmail) {
      newErrors.confirmEmail = "Email addresses do not match";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!user) {
      toast.error("You must be signed in to change your email.");
      return;
    }

    setIsSubmitting(true);
    setVerifyError("");
    setVerifySuccess("");

    try {
      const res = await createEmailAddressWithReverification(newEmail.trim());
      if (!res) throw new Error("Could not add email.");
      await res.prepareVerification({ strategy: "email_code" });
      await user.reload();
      setPendingEmailId(res.id);
      setVerificationStep(true);
      setVerifySuccess("Verification code sent. Please check your inbox.");
      toast.success("Verification code sent to your new email.");
    } catch (err: unknown) {
      if (isClerkRuntimeError(err) && isReverificationCancelledError(err)) {
        toast.info("Verification was cancelled.");
        setVerifyError("");
        return;
      }
      const message =
        err && typeof err === "object" && "errors" in err
          ? (err as { errors: Array<{ message: string }> }).errors[0]?.message
          : "Failed to add email. This address may already be in use.";
      toast.error(message);
      setVerifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pendingEmailId || !code.trim()) return;

    const emailAddress = user.emailAddresses.find(
      (a) => a.id === pendingEmailId,
    );
    if (!emailAddress) {
      setVerifyError("Session expired. Please start over.");
      return;
    }

    setIsSubmitting(true);
    setVerifyError("");
    setVerifySuccess("");

    try {
      const result = await emailAddress.attemptVerification({
        code: code.trim(),
      });
      const verified = result?.verification?.status === "verified";

      if (verified) {
        const newPrimaryId = emailAddress.id;
        const newPrimaryEmail = emailAddress.emailAddress;

        const idsToRemove = user.emailAddresses
          .filter((ea) => ea.id !== newPrimaryId)
          .map((ea) => ea.id);

        await user.update({ primaryEmailAddressId: newPrimaryId });

        if (idsToRemove.length > 0) {
          try {
            const removeRes = await fetch(
              "/api/settings/remove-email-addresses",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailAddressIds: idsToRemove }),
              },
            );
            if (!removeRes.ok) {
              console.warn(
                "Failed to remove old emails:",
                await removeRes.text(),
              );
            }
          } catch (err) {
            console.warn("Failed to remove old emails:", err);
          }
        }
        await user.reload();

        let profileSyncOk = false;
        try {
          const res = await fetch("/api/profile/update", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              field: "email",
              value: newPrimaryEmail,
            }),
          });
          const text = await res.text();
          if (!res.ok) {
            let msg = "Failed to sync email to profile.";
            try {
              const data = JSON.parse(text);
              if (data.details) msg += ` ${data.details}`;
            } catch {
              if (text) msg += ` ${text}`;
            }
            toast.error(msg);
          } else {
            profileSyncOk = true;
          }
        } catch {
          toast.error("Failed to sync email to profile. Please try again.");
        }

        if (profileSyncOk) {
          toast.success("Email updated successfully.");
        }
        handleCancelEmail();
        setShowEmailForm(false);
      } else {
        setVerifyError(
          "Verification failed. Please check the code and try again.",
        );
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "errors" in err
          ? (err as { errors: Array<{ message: string }> }).errors[0]?.message
          : "Invalid verification code";
      setVerifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!user || !pendingEmailId) return;

    const emailAddress = user.emailAddresses.find(
      (a) => a.id === pendingEmailId,
    );
    if (!emailAddress) {
      setVerifyError("Session expired. Please start over.");
      return;
    }

    setIsSubmitting(true);
    setVerifyError("");
    setVerifySuccess("");

    try {
      await emailAddress.prepareVerification({ strategy: "email_code" });
      setVerifySuccess("Verification code resent. Please check your email.");
      toast.success("Verification code resent.");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "errors" in err
          ? (err as { errors: Array<{ message: string }> }).errors[0]?.message
          : "Failed to resend code";
      setVerifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
        <div className="flex items-center justify-center py-8">
          <Spinner
            variant="spinner"
            size="sm"
            classNames={{
              spinnerBars: "bg-muted-foreground",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
      <div className="md:space-y-2 space-y-1">
        <h1 className="md:text-lg text-sm font-semibold text-foreground">
          Manage email
        </h1>
        <p className="md:text-sm text-xs text-muted-foreground">
          Change your account email address.
        </p>
      </div>
      <section
        className={`rounded-2xl border border-border ${isMobile ? "bg-transparent p-0 shadow-none" : "bg-transparent p-4 px-6 shadow-none"}`}
      >
        <div className={isMobile ? "space-y-4 px-4 pt-4 pb-4" : "space-y-4"}>
          {!showEmailForm ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <Label className="text-foreground text-sm">Current email</Label>
                <p className="text-sm font-medium">{currentEmail}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border border-border rounded-lg px-3 py-1 hover:bg-gray-200 transition-all duration-300"
                onClick={() => setShowEmailForm(true)}
              >
                Change Email
              </Button>
            </div>
          ) : !verificationStep ? (
            <div className="space-y-4 py-1">
              <div className="space-y-2">
                <Label htmlFor="new-email">New email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (errors.newEmail)
                      setErrors({ ...errors, newEmail: undefined });
                  }}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.newEmail}
                />
                {errors.newEmail && (
                  <p className="text-xs text-destructive">{errors.newEmail}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-email">Confirm email</Label>
                <Input
                  id="confirm-email"
                  type="email"
                  placeholder="Confirm new email"
                  value={confirmEmail}
                  onChange={(e) => {
                    setConfirmEmail(e.target.value);
                    if (errors.confirmEmail)
                      setErrors({ ...errors, confirmEmail: undefined });
                  }}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.confirmEmail}
                />
                {errors.confirmEmail && (
                  <p className="text-xs text-destructive">
                    {errors.confirmEmail}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg px-3 py-1"
                  onClick={handleRequestVerification}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        variant="spinner"
                        size="sm"
                        classNames={{
                          spinnerBars: "bg-primary-foreground",
                        }}
                      />
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border border-border rounded-lg px-3 py-1 hover:bg-gray-200 transition-all duration-300"
                  onClick={handleCancelEmail}
                  disabled={isSubmitting}
                >
                  <X className="md:hidden w-4 h-4" />
                  <span className="hidden md:block">Cancel</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-1">
              <div className="flex items-center gap-2 text-foreground">
                {/* <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" aria-hidden />
                </div> */}
                <div>
                  <p className="text-sm font-medium mb-3">
                    Verify your new email
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ve sent a 6-digit code to{" "}
                    <strong>{newEmail}</strong>. Enter it below.
                  </p>
                </div>
              </div>

              {verifyError && (
                <div
                  className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  {verifyError}
                </div>
              )}
              {verifySuccess && !verifyError && (
                <div
                  className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
                  role="status"
                >
                  {verifySuccess}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleVerifyCode}>
                <div className="space-y-2">
                  <Label
                    htmlFor="verify-code"
                    className="text-sm font-medium text-foreground"
                  >
                    Verification code
                  </Label>
                  <Input
                    id="verify-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="h-10 border-border focus:ring-transparent"
                    disabled={isSubmitting}
                    maxLength={6}
                  />
                </div>
                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap sm:flex-1 sm:min-w-0">
                    <span>Didn&apos;t receive the code?</span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="font-medium text-primary hover:underline focus:outline-none focus:underline disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      Resend
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:shrink-0">
                    <Button
                      type="submit"
                      size="sm"
                      className="rounded-lg px-3 py-1 w-full sm:w-auto"
                      disabled={isSubmitting || code.length !== 6}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner
                            variant="spinner"
                            size="sm"
                            classNames={{
                              spinnerBars: "bg-primary-foreground",
                            }}
                          />
                        </>
                      ) : (
                        "Verify email"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border border-border rounded-lg px-3 py-1 hover:bg-gray-200 transition-all duration-300 w-full sm:w-auto"
                      onClick={handleCancelEmail}
                      disabled={isSubmitting}
                    >
                      <X className="md:hidden w-4 h-4" />
                      <span className="hidden md:block">Cancel</span>
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
