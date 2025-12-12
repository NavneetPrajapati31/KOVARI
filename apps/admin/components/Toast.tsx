"use client";

import * as React from "react";
import { cn } from "../lib/utils";

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  onClose: () => void;
}

export function Toast({
  id,
  title,
  description,
  variant = "default",
  onClose,
}: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all animate-in slide-in-from-top-full",
        variant === "destructive" &&
          "border-destructive bg-destructive text-destructive-foreground",
        variant === "success" &&
          "border-green-500 bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-50",
        variant === "default" && "border bg-background text-foreground"
      )}
    >
      <div className="grid gap-1 flex-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <button
        title="Close"
        onClick={onClose}
        className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    title?: string;
    description?: string;
    variant?: "default" | "destructive" | "success";
  }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}

let toastIdCounter = 0;
const toastListeners = new Set<(toasts: ToastState[]) => void>();
let toastState: ToastState[] = [];

interface ToastState {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toastState]));
}

export function toast({
  title,
  description,
  variant = "default",
}: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}) {
  const id = `toast-${++toastIdCounter}`;
  toastState.push({ id, title, description, variant });
  notifyListeners();

  return {
    id,
    dismiss: () => {
      toastState = toastState.filter((t) => t.id !== id);
      notifyListeners();
    },
  };
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  React.useEffect(() => {
    const listener = (newToasts: ToastState[]) => {
      setToasts(newToasts);
    };
    toastListeners.add(listener);
    setToasts([...toastState]);

    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  const removeToast = React.useCallback((id: string) => {
    toastState = toastState.filter((t) => t.id !== id);
    notifyListeners();
  }, []);

  return { toasts, toast, removeToast };
}
