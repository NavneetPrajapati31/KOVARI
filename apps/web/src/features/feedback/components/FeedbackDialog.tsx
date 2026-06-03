"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@kovari/utils";
import { Spinner } from "@heroui/react";

const TYPES = [
  { value: "bug", label: "Bug"},
  { value: "suggestion", label: "Suggestion"},
  { value: "other", label: "Other"},
] as const;

type FeedbackType = (typeof TYPES)[number]["value"];

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const pathname = usePathname();
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (message.trim().length < 5) {
      toast.error("Please describe the issue in a bit more detail.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim(), page_url: pathname }),
      });

      if (!res.ok) throw new Error();

      toast.success("Thanks! Your feedback helps us improve Kovari.");
      setMessage("");
      setType("bug");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't send feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full rounded-xl sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Share feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Type selector */}
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors",
                  type === t.value
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Message */}
          <Textarea
            placeholder={
              type === "bug"
                ? "What happened? What did you expect?"
                : type === "suggestion"
                ? "What would make Kovari better for you?"
                : "What's on your mind?"
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none text-sm"
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground text-right -mt-2">
            {message.length}/2000
          </p>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading || message.trim().length < 5}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner variant="spinner" size="sm" classNames={{spinnerBars:"bg-primary-foreground"}} />
                Sending...
              </span>
            ) : (
              "Send feedback"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your feedback goes directly to the Kovari team.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
