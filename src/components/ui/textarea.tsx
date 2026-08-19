import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm transition-all resize-y",
        "placeholder:text-muted-foreground/70",
        "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15",
        "disabled:cursor-not-allowed disabled:opacity-55",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/15",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
