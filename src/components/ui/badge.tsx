import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        accent: "border-transparent bg-accent text-accent-foreground",
        outline: "border-border text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        success: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
        warning: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-400",
        danger: "border-rose-500/25 bg-rose-500/12 text-rose-700 dark:text-rose-400",
        next: "border-next/25 bg-next/12 text-next",
        national: "border-national/30 bg-national/14 text-national-deep dark:text-national",
        sapphire: "border-sapphire/25 bg-sapphire/12 text-sapphire",
        captain: "border-captain/25 bg-captain/12 text-captain",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
