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
        className="max-w-4xl bg-card max-h-[90vh] p-0 w-[calc(100%-2rem)] sm:w-[95vw] md:w-[90vw] lg:w-[85vw] overflow-hidden gap-0 flex flex-col rounded-2xl" // Higher z-index to sit on top of other modals
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
        <DialogHeader className="px-4 sm:px-6 py-4 border-b">
          <DialogTitle className="text-md text-start">{title}</DialogTitle>
        </DialogHeader>
        
        <div 
            className="overflow-y-auto flex-1 px-4 sm:px-6 pt-4 pb-2 sm:pb-4 hide-scrollbar"
            onClick={(e) => e.stopPropagation()}
        >
          <DialogDescription className="text-start text-sm font-medium text-foreground leading-relaxed mb-6">
            {description}
          </DialogDescription>

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

        <DialogFooter className="flex flex-row pt-2 sm:pt-0 pb-4 px-4 sm:px-6 bg-card w-full sticky bottom-0 z-10">
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
            disabled={isLoading}
            type="button"
            className="flex-1 h-10 rounded-lg shadow-none"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            type="button"
            className={cn(
                "flex-1 h-10 rounded-lg shadow-none",
                variant === "destructive" ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
            )}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
