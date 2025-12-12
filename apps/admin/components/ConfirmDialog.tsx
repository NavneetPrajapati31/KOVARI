"use client";

import * as React from "react";
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

  const canConfirm =
    (requireTypedConfirmation
      ? typedText === requireTypedConfirmation.text
      : true) && (validate ? validate() : true);

  const handleConfirm = async () => {
    if (!canConfirm || isLoading) return;
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
      setTypedText("");
    } catch (error) {
      console.error("Confirm error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg",
          "animate-in fade-in-0 zoom-in-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {children && <div className="mb-4">{children}</div>}

        {requireTypedConfirmation && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              Type <strong>{requireTypedConfirmation.text}</strong> to confirm:
            </label>
            <Input
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={requireTypedConfirmation.placeholder}
              className="w-full"
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setTypedText("");
            }}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
