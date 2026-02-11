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
      const response = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update password");
        return;
      }

      toast.success(data.message || "Password updated successfully!");
      handleCancelPassword();
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Failed to update password. Please try again.");
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
        className={`rounded-2xl border border-border ${isMobile ? "bg-transparent p-0 shadow-none" : "bg-transparent p-4 px-6 shadow-none"}`}
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
                variant="outline"
                size="sm"
                className="w-full md:w-auto border border-border rounded-lg px-3 py-1 hover:bg-gray-200 transition-all duration-300"
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
                    variant="outline"
                    size="sm"
                    className="border border-border rounded-lg px-3 py-1 hover:bg-gray-200 transition-all duration-300"
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
