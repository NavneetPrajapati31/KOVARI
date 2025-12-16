// src/shared/components/ReportDialog.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import { Flag, Loader2, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "user" | "group";
  targetId: string;
  targetName?: string;
}

const REPORT_REASONS = {
  user: [
    "Harassment / Abuse",
    "Fake profile",
    "Scam / Fraud",
    "Inappropriate content",
    "Safety concern",
    "Other",
  ],
  group: [
    "Harassment / Abuse",
    "Scam / Fraud",
    "Inappropriate content",
    "Safety concern",
    "Misleading information",
    "Other",
  ],
};

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
}: ReportDialogProps) {
  // Use refs to persist state across remounts (when parent re-renders)
  const reasonRef = useRef("");
  const customReasonRef = useRef("");
  const additionalNotesRef = useRef("");
  const evidenceFileRef = useRef<File | null>(null);
  const evidencePreviewRef = useRef<string | null>(null);
  const evidenceUrlRef = useRef<string | null>(null);
  const evidencePublicIdRef = useRef<string | null>(null);
  
  // State for UI updates (synced with refs)
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [evidencePublicId, setEvidencePublicId] = useState<string | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const hasFormData = useRef(false);
  const uploadInProgressRef = useRef(false);
  const wasOpenRef = useRef(false);

  const MAX_NOTES_LENGTH = 300;
  
  // SessionStorage key for persisting evidence across component unmounts
  const STORAGE_KEY = `report-dialog-${targetType}-${targetId}`;
  
  // Get current preview (use ref as fallback for Fast Refresh recovery)
  const currentPreview = evidencePreview || evidencePreviewRef.current;
  const currentEvidenceUrl = evidenceUrl || evidenceUrlRef.current;
  
  // Restore from sessionStorage on mount (handles complete component recreation)
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          console.log("🔄 Restoring from sessionStorage:", {
            hasEvidenceUrl: !!data.evidenceUrl,
            hasReason: !!data.reason,
            hasPreview: !!data.evidencePreview
          });
          
          // Always restore if stored data exists and current state is empty
          if (data.evidenceUrl && !evidenceUrl && !evidenceUrlRef.current) {
            console.log("✅ Restoring evidenceUrl from sessionStorage:", data.evidenceUrl);
            setEvidenceUrl(data.evidenceUrl);
            evidenceUrlRef.current = data.evidenceUrl;
          }
          if (data.evidencePublicId && !evidencePublicId && !evidencePublicIdRef.current) {
            setEvidencePublicId(data.evidencePublicId);
            evidencePublicIdRef.current = data.evidencePublicId;
          }
          if (data.evidencePreview && !evidencePreview && !evidencePreviewRef.current) {
            setEvidencePreview(data.evidencePreview);
            evidencePreviewRef.current = data.evidencePreview;
          }
          if (data.reason && !reason && !reasonRef.current) {
            setReason(data.reason);
            reasonRef.current = data.reason;
          }
          if (data.customReason && !customReason && !customReasonRef.current) {
            setCustomReason(data.customReason);
            customReasonRef.current = data.customReason;
          }
          if (data.additionalNotes && !additionalNotes && !additionalNotesRef.current) {
            setAdditionalNotes(data.additionalNotes);
            additionalNotesRef.current = data.additionalNotes;
          }
        }
      } catch (error) {
        console.error("Error restoring from sessionStorage:", error);
      }
    }
  }, [open]); // Run whenever dialog opens (STORAGE_KEY is stable)
  
  // Save to sessionStorage whenever evidence data changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (evidenceUrl || reason || additionalNotes)) {
      try {
        const dataToStore = {
          evidenceUrl: evidenceUrl || evidenceUrlRef.current,
          evidencePublicId: evidencePublicId || evidencePublicIdRef.current,
          evidencePreview: evidencePreview || evidencePreviewRef.current,
          reason: reason || reasonRef.current,
          customReason: customReason || customReasonRef.current,
          additionalNotes: additionalNotes || additionalNotesRef.current,
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
        console.log("💾 Saved to sessionStorage:", dataToStore);
      } catch (error) {
        console.error("Error saving to sessionStorage:", error);
      }
    }
  }, [evidenceUrl, evidencePublicId, evidencePreview, reason, customReason, additionalNotes, STORAGE_KEY]);

  // Sync refs with state when state changes
  useEffect(() => {
    reasonRef.current = reason;
  }, [reason]);
  useEffect(() => {
    customReasonRef.current = customReason;
  }, [customReason]);
  useEffect(() => {
    additionalNotesRef.current = additionalNotes;
  }, [additionalNotes]);
  useEffect(() => {
    evidenceFileRef.current = evidenceFile;
  }, [evidenceFile]);
  useEffect(() => {
    evidencePreviewRef.current = evidencePreview;
  }, [evidencePreview]);
  useEffect(() => {
    evidenceUrlRef.current = evidenceUrl;
  }, [evidenceUrl]);
  useEffect(() => {
    evidencePublicIdRef.current = evidencePublicId;
  }, [evidencePublicId]);

  // Restore state from refs when dialog opens OR component mounts (handles Fast Refresh)
  useEffect(() => {
    if (open) {
      // Always restore from refs when dialog is open (handles remounts during Fast Refresh)
      const refUrl = evidenceUrlRef.current;
      const stateUrl = evidenceUrl;
      const hasRefData = reasonRef.current || refUrl || additionalNotesRef.current;
      const missingState = !reason || !stateUrl || !additionalNotes;
      
      // More aggressive check: if refs have data, restore even if some state exists
      if (hasRefData && (missingState || !wasOpenRef.current || (refUrl && !stateUrl))) {
        console.log("🔄 Restoring state from refs (dialog open or remounted)");
        console.log("Refs have:", {
          reason: reasonRef.current,
          evidenceUrl: refUrl,
          evidencePublicId: evidencePublicIdRef.current,
          evidencePreview: !!evidencePreviewRef.current
        });
        console.log("State has:", {
          reason: !!reason,
          evidenceUrl: !!stateUrl,
          evidencePreview: !!evidencePreview,
          additionalNotes: !!additionalNotes
        });
        
        if (reasonRef.current && !reason) {
          console.log("✅ Restoring reason from ref");
          setReason(reasonRef.current);
        }
        if (customReasonRef.current && !customReason) {
          setCustomReason(customReasonRef.current);
        }
        if (additionalNotesRef.current && !additionalNotes) {
          setAdditionalNotes(additionalNotesRef.current);
        }
        if (evidenceFileRef.current && !evidenceFile) {
          setEvidenceFile(evidenceFileRef.current);
        }
        if (evidencePreviewRef.current && !evidencePreview) {
          console.log("✅ Restoring evidencePreview from ref");
          setEvidencePreview(evidencePreviewRef.current);
        }
        if (refUrl && !stateUrl) {
          console.log("✅ Restoring evidenceUrl from ref:", refUrl);
          setEvidenceUrl(refUrl);
        }
        if (evidencePublicIdRef.current && !evidencePublicId) {
          console.log("✅ Restoring evidencePublicId from ref:", evidencePublicIdRef.current);
          setEvidencePublicId(evidencePublicIdRef.current);
        }
      }
    }
    wasOpenRef.current = open;
  }, [open, reason, evidenceUrl, evidencePreview, customReason, additionalNotes, evidenceFile, evidencePublicId]);

  // Aggressive Fast Refresh recovery - check periodically if dialog is open
  useEffect(() => {
    if (!open) return;
    
    // Immediate restoration check
    const restoreNow = () => {
      let restored = false;
      const refUrl = evidenceUrlRef.current;
      const stateUrl = evidenceUrl;
      
      // Log current state for debugging
      if (refUrl && !stateUrl) {
        console.log("🔄 Fast Refresh recovery - ref has URL but state is missing");
        console.log("- ref URL:", refUrl);
        console.log("- state URL:", stateUrl);
      }
      
      if (refUrl && !stateUrl) {
        console.log("🔄 Fast Refresh recovery - restoring evidenceUrl from ref:", refUrl);
        setEvidenceUrl(refUrl);
        setEvidencePublicId(evidencePublicIdRef.current);
        restored = true;
      }
      if (evidencePreviewRef.current && !evidencePreview) {
        console.log("🔄 Fast Refresh recovery - restoring evidencePreview from ref");
        setEvidencePreview(evidencePreviewRef.current);
        restored = true;
      }
      if (evidenceFileRef.current && !evidenceFile) {
        setEvidenceFile(evidenceFileRef.current);
        restored = true;
      }
      if (reasonRef.current && !reason) {
        setReason(reasonRef.current);
        restored = true;
      }
      if (customReasonRef.current && !customReason) {
        setCustomReason(customReasonRef.current);
        restored = true;
      }
      if (additionalNotesRef.current && !additionalNotes) {
        setAdditionalNotes(additionalNotesRef.current);
        restored = true;
      }
      if (restored) {
        console.log("✅ State restored from refs after Fast Refresh");
        console.log("- evidenceUrl restored:", evidenceUrlRef.current);
        console.log("- evidencePublicId restored:", evidencePublicIdRef.current);
      }
    };
    
    // Run immediately (catches Fast Refresh that already happened)
    restoreNow();
    
    // Also check periodically (in case Fast Refresh happens after mount)
    // Use shorter interval for faster recovery
    const interval = setInterval(() => {
      restoreNow();
    }, 50); // Check every 50ms for faster recovery
    
    return () => clearInterval(interval);
  }, [open, evidenceUrl, evidencePreview, reason, customReason, additionalNotes, evidenceFile, evidencePublicId]);

  // Track if form has data to prevent accidental closes (check both state and refs)
  useEffect(() => {
    const hasData = reason || reasonRef.current || 
                   currentEvidenceUrl || 
                   additionalNotes || additionalNotesRef.current || 
                   customReason || customReasonRef.current || 
                   evidenceFile || evidenceFileRef.current || 
                   isUploadingEvidence;
    if (hasData) {
      hasFormData.current = true;
    }
  }, [reason, currentEvidenceUrl, additionalNotes, customReason, evidenceFile, isUploadingEvidence]);

  // Prevent dialog from closing if upload/submission is in progress
  useEffect(() => {
    // If parent tries to close during upload/submission, force it to stay open
    if (!open && (isUploadingEvidence || isSubmitting || uploadInProgressRef.current)) {
      console.log("⚠️ FORCING dialog to stay open - operation in progress");
      onOpenChange(true);
    }
  }, [open, isUploadingEvidence, isSubmitting, onOpenChange]);

  // Reset form data tracking when dialog closes (but not during upload)
  useEffect(() => {
    if (!open && !isUploadingEvidence && !isSubmitting && !uploadInProgressRef.current) {
      hasFormData.current = false;
    }
  }, [open, isUploadingEvidence, isSubmitting]);

  // Handle dialog close - prevent accidental closes when form has data or upload in progress
  const handleDialogOpenChange = (newOpen: boolean) => {
    // CRITICAL: Never allow closing during upload or submission
    if (!newOpen && (isUploadingEvidence || isSubmitting)) {
      console.log("⚠️ BLOCKED dialog close - upload or submission in progress");
      toast({
        title: isUploadingEvidence ? "Upload in progress" : "Submission in progress",
        description: isUploadingEvidence 
          ? "Please wait for the evidence upload to complete."
          : "Please wait for the report to be submitted.",
        variant: "default",
      });
      return; // Block the close completely
    }

    // If trying to close and form has data, prevent closing
    // User must explicitly cancel or submit
    if (!newOpen && hasFormData.current) {
      console.log("⚠️ Prevented dialog close - form has unsaved data");
      toast({
        title: "Unsaved changes",
        description: "Please submit or cancel to close the dialog.",
        variant: "default",
      });
      return;
    }
    
    // Only close if no data or explicitly cancelled/submitted
    onOpenChange(newOpen);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    console.log("=== FILE SELECTED ===");
    console.log("File name:", file.name);
    console.log("File type:", file.type);
    console.log("File size:", file.size);

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, or WebP).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Set both state and refs
    setEvidenceFile(file);
    evidenceFileRef.current = file;
    console.log("Evidence file set in state and ref");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      setEvidencePreview(preview);
      evidencePreviewRef.current = preview;
      console.log("Evidence preview created and stored in ref");
    };
    reader.readAsDataURL(file);

    // Upload to server
    console.log("Starting evidence upload to /api/flags/evidence");
    uploadInProgressRef.current = true;
    setIsUploadingEvidence(true);
    
    // CRITICAL: Force dialog to stay open during upload
    if (!open) {
      console.log("⚠️ Dialog was closed, forcing it open for upload");
      onOpenChange(true);
    }
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/flags/evidence", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log("=== EVIDENCE UPLOAD RESPONSE ===");
      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload evidence");
      }

      console.log("Setting evidence state:");
      console.log("- evidenceUrl:", data.evidenceUrl);
      console.log("- publicId:", data.publicId);

      // CRITICAL: Set refs FIRST (they persist through Fast Refresh)
      evidenceUrlRef.current = data.evidenceUrl;
      evidencePublicIdRef.current = data.publicId || null;
      
      // Ensure preview ref is set (it should already be set from file selection)
      if (!evidencePreviewRef.current && evidenceFileRef.current) {
        // Recreate preview from file if it was lost
        const reader = new FileReader();
        reader.onloadend = () => {
          const preview = reader.result as string;
          evidencePreviewRef.current = preview;
          setEvidencePreview(preview);
        };
        reader.readAsDataURL(evidenceFileRef.current);
      }
      
      // Set state (may be lost during Fast Refresh, but refs will restore it)
      setEvidenceUrl(data.evidenceUrl);
      setEvidencePublicId(data.publicId || null);
      
      // CRITICAL: Also save to sessionStorage (persists across complete component unmounts)
      if (typeof window !== 'undefined') {
        try {
          const dataToStore = {
            evidenceUrl: data.evidenceUrl,
            evidencePublicId: data.publicId || null,
            evidencePreview: evidencePreviewRef.current,
            reason: reasonRef.current,
            customReason: customReasonRef.current,
            additionalNotes: additionalNotesRef.current,
          };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
          console.log("💾 Saved evidence to sessionStorage after upload");
        } catch (error) {
          console.error("Error saving to sessionStorage:", error);
        }
      }
      
      console.log("✅ Evidence state set. Current values:");
      console.log("- evidenceUrl state:", data.evidenceUrl);
      console.log("- evidencePublicId state:", data.publicId);
      console.log("- evidenceUrl ref:", evidenceUrlRef.current);
      console.log("- evidencePublicId ref:", evidencePublicIdRef.current);
      console.log("- evidencePreview ref exists:", !!evidencePreviewRef.current);
      
      // Aggressive state restoration after upload (handles Fast Refresh)
      // Use a function that checks current state via closure
      const restoreState = () => {
        // Check if state was lost (Fast Refresh happened)
        const currentUrl = evidenceUrlRef.current;
        if (currentUrl) {
          // Force state update using functional setter to get latest state
          setEvidenceUrl((prev) => {
            if (!prev && currentUrl) {
              console.log("🔄 Restoring evidenceUrl from ref (Fast Refresh recovery)");
              return currentUrl;
            }
            return prev || currentUrl;
          });
          setEvidencePublicId((prev) => {
            const currentId = evidencePublicIdRef.current;
            if (!prev && currentId) {
              console.log("🔄 Restoring evidencePublicId from ref (Fast Refresh recovery)");
              return currentId;
            }
            return prev || currentId;
          });
          if (evidencePreviewRef.current) {
            setEvidencePreview((prev) => prev || evidencePreviewRef.current || null);
          }
          if (evidenceFileRef.current) {
            setEvidenceFile((prev) => prev || evidenceFileRef.current);
          }
        }
      };
      
      // Immediate check (in case Fast Refresh already happened)
      restoreState();
      
      // Check multiple times because Fast Refresh timing is unpredictable
      // Use longer delays to catch Fast Refresh that happens after parent re-renders
      setTimeout(() => {
        console.log("🔄 Post-upload restoration check (50ms)");
        restoreState();
      }, 50);
      setTimeout(() => {
        console.log("🔄 Post-upload restoration check (200ms)");
        restoreState();
      }, 200);
      setTimeout(() => {
        console.log("🔄 Post-upload restoration check (500ms)");
        restoreState();
      }, 500);
      setTimeout(() => {
        console.log("🔄 Post-upload restoration check (1000ms)");
        restoreState();
      }, 1000);
      setTimeout(() => {
        console.log("🔄 Post-upload restoration check (2000ms)");
        restoreState();
      }, 2000);
      setTimeout(() => {
        console.log("🔄 Post-upload restoration check (3000ms)");
        restoreState();
      }, 3000);
      
      toast({
        title: "Evidence uploaded",
        description: "Your evidence has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading evidence:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload evidence. You can still submit the report without it.",
        variant: "destructive",
      });
      setEvidenceFile(null);
      setEvidencePreview(null);
      evidenceFileRef.current = null;
      evidencePreviewRef.current = null;
    } finally {
      setIsUploadingEvidence(false);
      uploadInProgressRef.current = false;
      console.log("Upload process completed, uploadInProgressRef reset");
    }
  };

  const handleRemoveEvidence = () => {
    setEvidenceFile(null);
    setEvidencePreview(null);
    setEvidenceUrl(null);
    setEvidencePublicId(null);
    evidenceFileRef.current = null;
    evidencePreviewRef.current = null;
    evidenceUrlRef.current = null;
    evidencePublicIdRef.current = null;
    
    // Update sessionStorage to remove evidence
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          delete data.evidenceUrl;
          delete data.evidencePublicId;
          delete data.evidencePreview;
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } catch (error) {
        console.error("Error updating sessionStorage:", error);
      }
    }
  };

  const handleSubmit = async () => {
    // Prevent submit while evidence is uploading
    if (isUploadingEvidence) {
      toast({
        title: "Please wait",
        description: "Evidence is still uploading. Please wait for it to complete.",
        variant: "default",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please select a reason for reporting.",
        variant: "destructive",
      });
      return;
    }

    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!finalReason) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for reporting.",
        variant: "destructive",
      });
      return;
    }

    // Combine reason with additional notes if provided
    // Use refs as fallback in case component remounted
    const finalAdditionalNotes = additionalNotes || additionalNotesRef.current || "";
    let finalReasonWithNotes = finalReason;
    if (finalAdditionalNotes.trim()) {
      finalReasonWithNotes = `${finalReason}\n\nAdditional notes: ${finalAdditionalNotes.trim()}`;
    }

    // Prevent submit if upload just completed (give it a moment to set state)
    if (uploadInProgressRef.current) {
      console.log("⚠️ Upload just completed, waiting for state to update...");
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsSubmitting(true);

    console.log("=== SUBMITTING REPORT ===");
    console.log("Current state values:");
    console.log("- isUploadingEvidence:", isUploadingEvidence);
    console.log("- evidenceFile (state):", evidenceFile ? evidenceFile.name : null);
    console.log("- evidenceFile (ref):", evidenceFileRef.current ? evidenceFileRef.current.name : null);
    console.log("- evidenceUrl (state):", evidenceUrl);
    console.log("- evidencePublicId (state):", evidencePublicId);
    console.log("- evidenceUrl (ref):", evidenceUrlRef.current);
    console.log("- evidencePublicId (ref):", evidencePublicIdRef.current);
    console.log("- reason:", finalReasonWithNotes);
    console.log("- targetType:", targetType);
    console.log("- targetId:", targetId);
    
    // Use ref values if state values are null (component may have remounted due to Fast Refresh)
    // Also check sessionStorage as last resort (handles complete component recreation)
    let finalEvidenceUrl = evidenceUrl || evidenceUrlRef.current;
    let finalEvidencePublicId = evidencePublicId || evidencePublicIdRef.current;
    
    // Fallback to sessionStorage if both state and refs are empty
    if (!finalEvidenceUrl && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.evidenceUrl) {
            console.log("🔄 Restoring evidence from sessionStorage during submit");
            finalEvidenceUrl = data.evidenceUrl;
            finalEvidencePublicId = data.evidencePublicId || null;
          }
        }
      } catch (error) {
        console.error("Error reading from sessionStorage:", error);
      }
    }
    
    console.log("✅ Final values to submit:");
    console.log("- finalEvidenceUrl:", finalEvidenceUrl);
    console.log("- finalEvidencePublicId:", finalEvidencePublicId);
    
    if (finalEvidenceUrl) {
      console.log("✅ Evidence will be included in submission");
    } else {
      console.log("⚠️ No evidence URL available (neither state nor ref)");
    }
    
    // Double-check: if there's a file but no URL, wait a bit and check again
    if ((evidenceFile || evidenceFileRef.current) && !finalEvidenceUrl && !isUploadingEvidence) {
      console.warn("⚠️ Evidence file exists but URL is missing - upload may have failed");
      toast({
        title: "Evidence upload issue",
        description: "Evidence file was selected but upload may have failed. Please re-upload or submit without evidence.",
        variant: "destructive",
      });
      // Don't block submission, but warn user
    }

    const requestPayload = {
      targetType,
      targetId,
      reason: finalReasonWithNotes,
      evidenceUrl: finalEvidenceUrl,
      evidencePublicId: finalEvidencePublicId,
    };

    console.log("Request payload:", JSON.stringify(requestPayload, null, 2));

    try {
      const response = await fetch("/api/flags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json();

      console.log("=== REPORT SUBMISSION RESPONSE ===");
      console.log("Status:", response.status);
      console.log("Response OK:", response.ok);
      console.log("Response data:", data);

      if (!response.ok) {
        console.error("❌ Report submission failed:", {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // Handle 429 (Too Many Requests) - duplicate report
        if (response.status === 429) {
          const errorMessage = data.details 
            ? data.details
            : data.error || "You have already reported this user recently. Please wait 24 hours before reporting again.";
          throw new Error(errorMessage);
        }
        
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}`
          : data.error || "Failed to submit report";
        throw new Error(errorMessage);
      }

      console.log("✅ Report submitted successfully:", data);

      toast({
        title: "Report submitted",
        description:
          "Thank you for your report. Our team will review it shortly.",
      });

      // Reset form data tracking
      hasFormData.current = false;

      // Reset form and close dialog
      setReason("");
      setCustomReason("");
      setAdditionalNotes("");
      setEvidenceFile(null);
      setEvidencePreview(null);
      setEvidenceUrl(null);
      setEvidencePublicId(null);
      // Also reset refs
      reasonRef.current = "";
      customReasonRef.current = "";
      additionalNotesRef.current = "";
      evidenceFileRef.current = null;
      evidencePreviewRef.current = null;
      evidenceUrlRef.current = null;
      evidencePublicIdRef.current = null;
      // Clear sessionStorage on successful submission
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
          console.log("🗑️ Cleared sessionStorage after successful submission");
        } catch (error) {
          console.error("Error clearing sessionStorage:", error);
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form data tracking
    hasFormData.current = false;
    
    setReason("");
    setCustomReason("");
    setAdditionalNotes("");
    setEvidenceFile(null);
    setEvidencePreview(null);
    setEvidenceUrl(null);
    setEvidencePublicId(null);
    // Also reset refs
    reasonRef.current = "";
    customReasonRef.current = "";
    additionalNotesRef.current = "";
    evidenceFileRef.current = null;
    evidencePreviewRef.current = null;
    evidenceUrlRef.current = null;
    evidencePublicIdRef.current = null;
    
    // Clear sessionStorage on cancel
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        console.log("🗑️ Cleared sessionStorage on cancel");
      } catch (error) {
        console.error("Error clearing sessionStorage:", error);
      }
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent 
        className="sm:max-w-[500px]"
        onEscapeKeyDown={(e) => {
          // Prevent ESC from closing if form has data or upload in progress
          if ((hasFormData.current || isUploadingEvidence) && !isSubmitting) {
            e.preventDefault();
            if (isUploadingEvidence) {
              toast({
                title: "Upload in progress",
                description: "Please wait for the evidence upload to complete.",
                variant: "default",
              });
            } else {
              toast({
                title: "Unsaved changes",
                description: "Please submit or cancel to close the dialog.",
                variant: "default",
              });
            }
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent outside click from closing if form has data or upload in progress
          if ((hasFormData.current || isUploadingEvidence) && !isSubmitting) {
            e.preventDefault();
            if (isUploadingEvidence) {
              toast({
                title: "Upload in progress",
                description: "Please wait for the evidence upload to complete.",
                variant: "default",
              });
            } else {
              toast({
                title: "Unsaved changes",
                description: "Please submit or cancel to close the dialog.",
                variant: "default",
              });
            }
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Report {targetType === "user" ? "User" : "Group"}
          </DialogTitle>
          <DialogDescription>
            {targetName && (
              <span className="font-medium">{targetName}</span>
            )}
            {targetName && <br />}
            Help us keep our community safe by reporting inappropriate behavior.
            All reports are reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS[targetType].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason (for "Other") */}
          {reason === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Please provide details *</Label>
              <Textarea
                id="customReason"
                placeholder="Describe the issue..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          )}

          {/* Evidence Upload */}
          <div className="space-y-2">
            <Label htmlFor="evidence">
              Upload evidence (optional but helps us act faster)
            </Label>
            {!(evidencePreview || evidencePreviewRef.current) ? (
              <div className="flex items-center gap-2">
                <Input
                  id="evidence"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  disabled={isUploadingEvidence || isSubmitting}
                  className="cursor-pointer"
                />
                {isUploadingEvidence && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Uploading...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="relative w-full h-48 border rounded-md overflow-hidden bg-muted">
                  <img
                    src={currentPreview || ""}
                    alt="Evidence preview"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveEvidence}
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Evidence uploaded successfully
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Supported formats: JPEG, PNG, GIF, WebP (max 10MB)
            </p>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="additionalNotes">Additional notes (optional)</Label>
              <span className="text-xs text-muted-foreground">
                {additionalNotes.length}/{MAX_NOTES_LENGTH}
              </span>
            </div>
            <Textarea
              id="additionalNotes"
              placeholder="Any additional information that might help..."
              value={additionalNotes}
              onChange={(e) => {
                if (e.target.value.length <= MAX_NOTES_LENGTH) {
                  setAdditionalNotes(e.target.value);
                }
              }}
              rows={3}
              className="resize-none"
              maxLength={MAX_NOTES_LENGTH}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason || isUploadingEvidence}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isUploadingEvidence ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading evidence...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
