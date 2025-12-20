"use client";

import React, { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@heroui/react";
import { toast } from "sonner";

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WaitlistModal({
  open,
  onOpenChange,
}: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error responses
        const errorMessage =
          data.error || "Failed to join waitlist. Please try again.";
        toast.error(errorMessage);
        return;
      }

      // Track successful waitlist submission
      Sentry.startSpan(
        {
          op: "waitlist.submit",
          name: "Waitlist Submission Success",
        },
        (span) => {
          span.setAttribute("success", true);
          span.setAttribute("email_domain", email.split("@")[1] || "unknown");
          span.setAttribute("waitlist_id", data.data?.id || "unknown");
        }
      );

      // Success
      toast.success("Successfully joined the waitlist!", {
        description: "We'll notify you when KOVARI is ready.",
      });

      // Close modal and reset form on success
      onOpenChange(false);
      setEmail("");
    } catch (error) {
      console.error("Error submitting waitlist:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-xs sm:max-w-md md:max-w-lg p-4 sm:p-6 rounded-lg !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !m-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-0 sm:px-0">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-left text-foreground">
            Join our waitlist
          </DialogTitle>
          <DialogDescription className="text-left text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2">
            Be among the first to experience KOVARI. Get early access to match
            with travelers and plan trips together.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-6 mt-3 sm:mt-4"
        >
          {/* Email Input */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs sm:text-sm font-medium leading-none text-foreground"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-9 sm:h-10 text-sm sm:text-base"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full h-10 sm:h-12 bg-primary text-primary-foreground font-bold text-sm sm:text-base shadow-sm hover:bg-primary/90 disabled:opacity-50"
            radius="full"
            variant="solid"
          >
            {isSubmitting ? "Joining..." : "Join Waitlist"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
