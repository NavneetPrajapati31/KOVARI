"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@heroui/react";

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
      // TODO: Implement API call to submit waitlist form
      console.log("Submitting waitlist:", { email });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Close modal and reset form on success
      onOpenChange(false);
      setEmail("");
    } catch (error) {
      console.error("Error submitting waitlist:", error);
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
