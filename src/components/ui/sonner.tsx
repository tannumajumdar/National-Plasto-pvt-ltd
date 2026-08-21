"use client";

import { Toaster as Sonner } from "sonner";

import { useTheme } from "@/hooks/use-theme";

export function Toaster() {
  // Toasts render above everything, so they have to follow the theme too —
  // a light toast over a dark page is the most obvious way to miss one.
  const { resolvedTheme, mounted } = useTheme();

  return (
    <Sonner
      theme={mounted ? resolvedTheme : "system"}
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
