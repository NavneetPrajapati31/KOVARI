"use client";

import * as React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setTypedText("");
      setIsLoading(false);
    }
  }, [open]);

  // Calculate canConfirm - call validate function if provided
  const canConfirm = React.useMemo(() => {
    const typedTextMatch = requireTypedConfirmation
      ? typedText === requireTypedConfirmation.text
      : true;
    
    let validationResult = true;
    if (validate) {
      try {
        validationResult = validate();
      } catch (error) {
        console.error("Error in validate function:", error);
        validationResult = false;
      }
    }
    
    return typedTextMatch && validationResult;
  }, [typedText, requireTypedConfirmation, validate]);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canConfirm || isLoading) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error in confirm dialog:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px] z-[300]" // Higher z-index to sit on top of other modals
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside if we want to force explicit detailed action
          // But usually standard behavior is fine. 
          // Crucially, we stop propagation here to prevent the click from reaching the underlying modal
          e.preventDefault(); 
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div 
            className="py-4"
            onClick={(e) => e.stopPropagation()}
        >
          {children}
          
          {requireTypedConfirmation && (
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Type <strong>{requireTypedConfirmation.text}</strong> to confirm:
              </label>
              <Input
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder={requireTypedConfirmation.placeholder}
                className="w-full"
                autoComplete="off"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
            disabled={isLoading}
            type="button"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            type="button"
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
