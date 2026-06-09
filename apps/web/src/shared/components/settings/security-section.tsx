"use client";

import React, { useState } from "react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Spinner } from "@heroui/react";
import { useUser, useReverification } from "@clerk/nextjs";
import {
  isClerkRuntimeError,
  isReverificationCancelledError,
} from "@clerk/nextjs/errors";

export function SecuritySection() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const isMobile = useIsMobile();
  const router = useRouter();
  const { user } = useUser();

  const updatePasswordWithReverification = useReverification(
    ({ currentPassword, newPassword }: any) =>
      user?.updatePassword({ currentPassword, newPassword }) ??
      Promise.reject(new Error("Not signed in")),
  );

  const handleCancelPassword = () => {
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  const handleSavePassword = async () => {
    // Clear previous errors
    setErrors({});

    // Validate inputs
    const newErrors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (currentPassword === newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. If Web/Clerk user, update password on the client side first
      // This enforces current password verification securely through Clerk.
      if (user) {
        if (!user.passwordEnabled) {
          toast.error("Password authentication is not enabled for your account.");
          setIsSubmitting(false);
          return;
        }

        await updatePasswordWithReverification({
          currentPassword,
          newPassword,
        });
      }

      // 2. Call backend to update Supabase password hash (and handle mobile if needed)
      const response = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
          skipClerkUpdate: !!user, // Skip Clerk backend update if we already did it client-side
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error || "Failed to update password";
        if (message.toLowerCase().includes("current password")) {
          setErrors(prev => ({ ...prev, currentPassword: message }));
        } else if (message.toLowerCase().includes("new password") || message.toLowerCase().includes("complexity")) {
          setErrors(prev => ({ ...prev, newPassword: message }));
        } else {
          toast.error(message);
        }
        return;
      }

      toast.success(data.message || "Password updated successfully!");
      handleCancelPassword();
    } catch (error: any) {
      if (isClerkRuntimeError(error) && isReverificationCancelledError(error)) {
        toast.info("Verification was cancelled.");
        return;
      }
      console.error("Password update error:", error);

      // Extract Clerk validation or verification error messages and map them inline
      if (error.errors && Array.isArray(error.errors)) {
        const fieldErrors: typeof errors = {};
        error.errors.forEach((clerkErr: any) => {
          const message = clerkErr.message;
          const param = clerkErr.meta?.paramName || "";
          const code = clerkErr.code || "";

          if (param === "current_password" || code === "form_password_incorrect" || message.toLowerCase().includes("current password")) {
            fieldErrors.currentPassword = message;
          } else if (param === "password" || code === "form_password_validation_failed" || message.toLowerCase().includes("password length") || message.toLowerCase().includes("complexity")) {
            fieldErrors.newPassword = message;
          } else {
            toast.error(message);
          }
        });

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...fieldErrors }));
          return;
        }
      }

      const message = error.message || "Failed to update password. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
      <div className="md:space-y-2 space-y-1">
        <h1 className="md:text-lg text-sm font-semibold text-foreground">
          Manage password
        </h1>
        <p className="md:text-sm text-xs text-muted-foreground">
          Change your account password.
        </p>
      </div>
      <section
        className={`rounded-2xl border border-border ${isMobile ? "bg-card p-0 shadow-none" : "bg-transparent p-4 px-6 shadow-none"}`}
      >
        <div className={isMobile ? "space-y-4 px-4 pt-4 pb-4" : "space-y-4"}>
          {!showPasswordForm ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Keep your account secure
                </p>
                <p className="text-sm text-muted-foreground">
                  Set a strong new password to help keep your account secure.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-muted-foreground border border-border rounded-lg px-3 py-1 transition-all duration-300"
                onClick={() => setShowPasswordForm(true)}
              >
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-1">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errors.currentPassword)
                      setErrors({ ...errors, currentPassword: undefined });
                  }}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.currentPassword}
                />
                {errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {errors.currentPassword}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword)
                      setErrors({ ...errors, newPassword: undefined });
                  }}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.newPassword}
                />
                {errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {errors.newPassword}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  className="text-sm text-foreground hover:underline font-medium"
                  onClick={() => router.push("/forgot-password?from=settings")}
                >
                  Forgot password
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-lg px-3 py-1"
                    onClick={handleSavePassword}
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
                      "Save"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="border border-border rounded-lg px-3 py-1 transition-all duration-300"
                    onClick={handleCancelPassword}
                    disabled={isSubmitting}
                  >
                    <X className="md:hidden w-4 h-4" />
                    <span className="hidden md:block">Cancel</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

