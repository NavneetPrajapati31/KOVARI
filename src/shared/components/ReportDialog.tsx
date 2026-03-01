// src/shared/components/ReportDialog.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";
import { Loader2, X, ImageIcon, CheckCircle2, Check, CheckIcon } from "lucide-react";
import { ImageUpload } from "@/shared/components/image-upload";
import * as Sentry from "@sentry/nextjs";
import { cn } from "../utils/utils";
import { Input } from "./ui/input";
import { Spinner } from "@heroui/react";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "user" | "group";
  targetId: string;
  targetName?: string;
  onSubmit?: (
    reason: string,
    evidenceUrl: string | null,
    evidencePublicId: string | null,
    additionalNotes: string
  ) => Promise<boolean>;
  onSuccess?: () => void;
}


const REPORT_REASONS = {
  user: [
    "Spam",
    "Harassment or bullying",
    "Hate speech",
    "Nudity or sexual activity",
    "Scams or fraud",
    "Violence or dangerous content",
    "Suicide or self-injury",
    "Underage",
    "Other",
  ],
  group: [
    "Spam",
    "Hate speech",
    "Harassment",
    "Nudity or sexual content",
    "Violence or harmful content",
    "Misinformation",
    "Illegal activities",
    "Other",
  ],
};

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
  onSubmit,
  onSuccess,
}: ReportDialogProps) {
  // State for UI updates
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [evidencePublicId, setEvidencePublicId] = useState<string | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const MAX_NOTES_LENGTH = 300;

  useEffect(() => {
    console.log("ReportDialog isSuccess changed to:", isSuccess);
  }, [isSuccess]);

  // Auto-close dialog after showing success message
  useEffect(() => {
    if (isSuccess) {
      console.log("Starting auto-close timer...");
      const timer = setTimeout(() => {
        console.log("Auto-close timer fired. Closing dialog.");
        handleDialogOpenChange(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const resetForm = () => {
    setReason("");
    setCustomReason("");
    setAdditionalNotes("");
    setEvidenceFile(null);
    setEvidencePreview(null);
    setEvidenceUrl(null);
    setEvidencePublicId(null);
  };

  // Handle dialog close - only block during upload/submission
  const handleDialogOpenChange = (newOpen: boolean) => {
    // CRITICAL: Prevent accidental closing during operations
    if (!newOpen && (isUploadingEvidence || isSubmitting)) {
      toast({
        title: isUploadingEvidence ? "Upload in progress" : "Submission in progress",
        description: "Please wait for the current action to complete.",
        variant: "default",
      });
      return; 
    }
    
    if (!newOpen) {
      // Small delay on reset to allow outgoing exit animation to happen smoothly
      setTimeout(() => {
        resetForm();
        setIsSuccess(false);
      }, 300);
    }
    
    onOpenChange(newOpen);
  };

  const handleRemoveEvidence = () => {
    setEvidenceFile(null);
    setEvidencePreview(null);
    setEvidenceUrl(null);
    setEvidencePublicId(null);
  };

  const handleImageUpload = (file: File | string) => {
    setEvidenceUrl(typeof file === 'string' ? file : URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setSubmitError(null); // Clear previous errors

    if (isUploadingEvidence) {
      setSubmitError("Please wait for the evidence upload to complete.");
      return;
    }

    if (!reason) {
      setSubmitError("Please select a reason for reporting.");
      return;
    }

    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!finalReason) {
      setSubmitError("Please provide specific details for reporting.");
      return;
    }

    const finalAdditionalNotes = additionalNotes || "";
    let finalReasonWithNotes = finalReason;
    if (finalAdditionalNotes.trim()) {
      finalReasonWithNotes = `${finalReason}\n\nAdditional notes: ${finalAdditionalNotes.trim()}`;
    }

    setIsSubmitting(true);

    if (onSubmit) {
      try {
        const success = await onSubmit(
          finalReasonWithNotes,
          evidenceUrl,
          evidencePublicId,
          additionalNotes
        );
        if (success) setIsSuccess(true);
      } catch (error) {
        console.error("Custom onSubmit error:", error);
        toast({
          title: "Error",
          description: "Failed to submit report.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const requestPayload = {
      targetType,
      targetId,
      reason: finalReasonWithNotes,
      evidenceUrl,
      evidencePublicId,
    };

    try {
      console.log("Sending request to /api/flags with:", requestPayload);
      const response = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Server returned a non-JSON response (Status ${response.status})`);
      }
      console.log("Response data:", data);

      if (!response.ok) {
        if (response.status === 501) {
          throw new Error(data.error || "Feature not supported yet.");
        }
        // Prioritize data.details for explicit backend reporting restriction messages
        throw new Error(data.details || data.error || "Failed to submit report");
      }

      // Normal success
      console.log("Normal 200 Success. Calling setIsSuccess(true).");
      setIsSuccess(true);
      onSuccess?.();
      toast({
        title: "Report submitted",
        description: "We'll review your report shortly.",
      });
    } catch (error) {
      console.error("Caught error in handleSubmit:", error);
      
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setSubmitError(errorMessage);
      
      // Still log to Sentry if it's an unexpected internal error
      const isExpectedError = error instanceof Error && 
        (error.message.includes("Failed to create flag") || error.message.includes("already reported") || error.message.includes("not supported"));

      if (error instanceof Error && !isExpectedError) {
        Sentry.captureException(error, {
          tags: { component: "ReportDialog", targetType, action: "submit" },
          extra: { targetId, hasEvidence: !!evidenceUrl },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="rounded-2xl border-border max-w-[min(530px,calc(100vw-2rem))] p-0 gap-0 overflow-hidden"
        onEscapeKeyDown={(e) => {
          if (isUploadingEvidence || isSubmitting) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (isUploadingEvidence || isSubmitting) e.preventDefault();
        }}
      >
        <div className={cn("px-6 py-5 border-b border-border/40 sticky top-0", isSuccess && "sr-only border-none px-0 py-0")}>
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-md font-semibold tracking-tight">
                {isSuccess ? "Report Submitted Successfully" : `Report ${targetType === "user" ? "User" : "Group"}`}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              {isSuccess ? "Your report has been received and is under review." : "Your report is strictly confidential. Help us understand what went wrong."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center px-8 py-8 animate-in fade-in duration-500 min-h-[230px]">
             <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="text-md sm:text-lg font-bold text-foreground mb-2">Report Received</h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Thank you for keeping Kovari safe. Our moderation team will review your report shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 grid gap-6 overflow-y-auto max-h-[45vh] hide-scrollbar overscroll-contain will-change-scroll transform-gpu scroll-smooth">
              
              {/* Reason Grouped List (iOS Style) */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase px-1">
                  Select a reason
                </Label>
                <div className="bg-card rounded-xl overflow-hidden border border-border/40 shadow-sm">
                  <div className="divide-y divide-border/40">
                    {REPORT_REASONS[targetType].map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => {
                          setReason(r);
                          if (r !== "Other") setCustomReason("");
                        }}
                        className="w-full flex items-center justify-between py-2 px-4 hover:bg-secondary/50 active:bg-secondary transition-colors text-left"
                      >
                        <span className="text-sm text-muted-foreground">{r}</span>
                        {reason === r && (
                          <CheckIcon className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Reason Textarea */}
              {reason === "Other" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="customReason" className="text-xs font-medium text-muted-foreground uppercase px-1">
                    Please specify
                  </Label>
                  <Textarea
                    id="customReason"
                    placeholder="Briefly describe what happened..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="min-h-[100px] resize-none focus-visible:ring-primary/40 rounded-xl bg-card border-border/40 shadow-sm"
                  />
                </div>
              )}

            

              {/* Evidence Drag & Drop Upload */}
              <div className="space-y-3">
                 <div className="flex items-center justify-between px-1">
                   <Label className="text-xs font-medium text-muted-foreground uppercase">
                      Attach evidence
                   </Label>
                   <span className="text-xs text-muted-foreground uppercase">Optional</span>
                 </div>
                
                 <div className="bg-card rounded-xl overflow-hidden p-1">
                   <ImageUpload
                      value={evidenceUrl}
                      onImageUpload={handleImageUpload}
                      onImageRemove={handleRemoveEvidence}
                      label=""
                      hideLabel
                      maxSizeInMB={5}
                      className="w-full border-none shadow-none"
                      acceptedFormats={["PNG", "JPG", "JPEG", "WEBP"]}
                   />
                 </div>
              </div>

                {/* Additional Context */}
              <div className="space-y-3">
                 <div className="flex items-center justify-between px-1">
                   <Label htmlFor="additionalNotes" className="text-xs font-medium text-muted-foreground uppercase">
                      Additional context
                   </Label>
                   <span className="text-xs text-muted-foreground uppercase">Optional</span>
                 </div>
                <Textarea
                  id="additionalNotes"
                  placeholder="Provide any additional details that might help our review..."
                  value={additionalNotes}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_NOTES_LENGTH) {
                      setAdditionalNotes(e.target.value);
                    }
                  }}
                  className="min-h-[80px] resize-none focus-visible:ring-primary/40 rounded-xl bg-card border-border/40 shadow-sm"
                  maxLength={MAX_NOTES_LENGTH}
                />
                 <div className="text-xs text-muted-foreground text-right w-full px-1">
                    {additionalNotes.length} / {MAX_NOTES_LENGTH}
                  </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-border/50 bg-card rounded-b-2xl">
              {submitError && (
                <div className="mb-3 px-3 py-2 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
                   {submitError}
                </div>
              )}
              <DialogFooter className="gap-2 sm:gap-0 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting || isUploadingEvidence}
                  className="rounded-full font-medium hover:bg-background text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !reason || (reason === "Other" && !customReason.trim()) || isUploadingEvidence}
                  className="rounded-full shadow-md min-w-[140px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm"
                >
                  {isSubmitting ? (
                    <><Spinner variant="spinner" size="sm" classNames={{spinnerBars:"bg-primary-foreground"}}/> Submitting</>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

