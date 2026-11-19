"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: string;
  variant?: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const variantStyles: Record<
  ToastVariant,
  { bg: string; border: string; icon: any; iconColor: string }
> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle,
    iconColor: "text-emerald-600",
  },
  error: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: AlertCircle,
    iconColor: "text-rose-600",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
  info: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    icon: Info,
    iconColor: "text-sky-600",
  },
};

export function Toast({
  id,
  variant = "info",
  title,
  description,
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 200);
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg",
        styles.bg,
        styles.border,
        isExiting ? "toast-exit" : "toast-enter"
      )}
    >
      <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center", styles.iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-xs font-bold text-[var(--foreground)]">{title}</p>
        {description && (
          <p className="text-[11px] text-[var(--muted-foreground)]">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="shrink-0 rounded-lg p-0.5 text-[var(--muted-foreground)] transition-colors hover:bg-black/5 hover:text-[var(--foreground)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface ToastContextType {
  toasts: Array<{
    id: string;
    variant: ToastVariant;
    title: string;
    description?: string;
  }>;
  addToast: (toast: Omit<ToastContextType["toasts"][0], "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastContextType["toasts"]>([]);

  const addToast = (toast: Omit<ToastContextType["toasts"][0], "id">) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
