"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  requireTypedConfirmation?: {
    text: string;
    placeholder: string;
  };
  onConfirm: () => void | Promise<void>;
  children?: React.ReactNode;
  validate?: () => boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  requireTypedConfirmation,
  onConfirm,
  validate,
  children,
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Calculate canConfirm - call validate function if provided
  const canConfirm = React.useMemo(() => {
    const typedTextMatch = requireTypedConfirmation
      ? typedText === requireTypedConfirmation.text
      : true;
    
    let validationResult = true;
    if (validate) {
      try {
        validationResult = validate();
        console.log("Validate function result:", validationResult);
      } catch (error) {
        console.error("Error in validate function:", error);
        validationResult = false;
      }
    }
    
    const result = typedTextMatch && validationResult;
    console.log("canConfirm calculation:", {
      typedTextMatch,
      validationResult,
      result,
      hasRequireTypedConfirmation: !!requireTypedConfirmation,
      hasValidate: !!validate,
    });
    return result;
  }, [typedText, requireTypedConfirmation, validate]);

  const handleConfirm = async () => {
    console.log("=== HANDLE CONFIRM CALLED ===");
    console.log("Can confirm:", canConfirm);
    console.log("Is loading:", isLoading);
    console.log("Require typed confirmation:", requireTypedConfirmation);
    console.log("Typed text:", typedText);
    console.log("Validate function:", validate);
    console.log("Validate result:", validate ? validate() : "no validate function");
    
    if (!canConfirm || isLoading) {
      console.log("Cannot confirm - early return:", { canConfirm, isLoading });
      return;
    }
    
    console.log("=== CONFIRM DIALOG ===");
    console.log("Calling onConfirm...");
    setIsLoading(true);
    
    try {
      console.log("About to call onConfirm callback");
      await onConfirm();
      console.log("onConfirm completed successfully");
      // Close dialog only after successful completion
      // Parent component will also handle closing, but we close here as backup
      onOpenChange(false);
      setTypedText("");
    } catch (error) {
      console.error("=== CONFIRM ERROR ===");
      console.error("Error in confirm dialog:", error);
      console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      // Don't close dialog on error - let the parent component handle it
      // Don't re-throw - let parent handle the error via toast
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      console.log("=== CONFIRM DIALOG RENDERED ===");
      console.log("Title:", title);
      console.log("Description:", description);
      console.log("Can confirm:", canConfirm);
      console.log("Is loading:", isLoading);
    }
  }, [open, title, description, canConfirm, isLoading]);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!open) {
    console.log("ConfirmDialog: not open, returning null");
    return null;
  }

  console.log("ConfirmDialog: rendering dialog");

  const dialogContent = (
    <div 
      className="fixed inset-0 z-[200]" 
      style={{ zIndex: 200 }}
      onMouseDown={(e) => {
        // Only close if clicking directly on the backdrop (not on dialog content)
        if (e.target === e.currentTarget) {
          console.log("Backdrop clicked, closing dialog");
          onOpenChange(false);
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        style={{ zIndex: 200 }}
        onMouseDown={(e) => {
          // Only close if clicking directly on backdrop, not on dialog content
          if (e.target === e.currentTarget) {
            onOpenChange(false);
          }
        }}
      />
      {/* Dialog Content Container */}
      <div 
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 200 }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Content */}
        <div
          className={cn(
            "relative w-full max-w-md rounded-lg border bg-background p-6 shadow-lg pointer-events-auto",
            "animate-in fade-in-0 zoom-in-95"
          )}
          style={{ zIndex: 201 }}
          onMouseDown={(e) => {
            // Stop all mouse events from propagating to backdrop
            e.stopPropagation();
          }}
          onClick={(e) => {
            // Stop all click events from propagating to backdrop
            e.stopPropagation();
          }}
        >
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {children && (
          <div 
            className="mb-4"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onBlur={(e) => e.stopPropagation()}
            style={{ pointerEvents: "auto" }}
          >
            {children}
          </div>
        )}

        {requireTypedConfirmation && (
          <div 
            className="mb-4"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <label className="text-sm font-medium mb-2 block">
              Type <strong>{requireTypedConfirmation.text}</strong> to confirm:
            </label>
            <Input
              value={typedText}
              onChange={(e) => {
                e.stopPropagation();
                setTypedText(e.target.value);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder={requireTypedConfirmation.placeholder}
              className="w-full"
            />
          </div>
        )}

        <div 
          className="flex justify-end gap-2" 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            onClick={(e) => {
              console.log("=== CANCEL BUTTON CLICKED ===");
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
              setTypedText("");
            }}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={isLoading}
            type="button"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={(e) => {
              console.log("=== CONFIRM BUTTON CLICKED ===");
              e.preventDefault();
              e.stopPropagation();
              
              // Re-check validation at click time
              let currentCanConfirm = true;
              if (requireTypedConfirmation) {
                currentCanConfirm = typedText === requireTypedConfirmation.text;
              }
              
              if (validate) {
                try {
                  const validationResult = validate();
                  currentCanConfirm = currentCanConfirm && validationResult;
                } catch (error) {
                  console.error("Error calling validate:", error);
                  currentCanConfirm = false;
                }
              }
              
              if (!currentCanConfirm || isLoading) {
                return;
              }
              
              // Call handleConfirm directly - it will check again internally
              handleConfirm();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!canConfirm || isLoading}
            type="button"
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );

  // Render in a portal to ensure it's above everything else
  if (!mounted) {
    return null;
  }

  return createPortal(dialogContent, document.body);
}
