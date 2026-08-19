"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      offset={20}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-2xl border border-border bg-card text-card-foreground shadow-float font-sans",
          title: "font-semibold text-sm",
          description: "text-muted-foreground text-sm",
          actionButton: "bg-accent text-accent-foreground rounded-full",
          cancelButton: "bg-secondary text-secondary-foreground rounded-full",
          success: "[&_[data-icon]]:text-emerald-500",
          error: "[&_[data-icon]]:text-rose-500",
        },
      }}
    />
  );
}
