import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Buttons carry most of the brand's "premium" signal, so the variants lean on
 * gradient + glow rather than flat fills, and every one settles on the same
 * spring-ish easing.
 *
 * `group` is on the base class so a `.cta-arrow` icon inside any button gets
 * the hover nudge for free — see the utility in globals.css.
 */
const buttonVariants = cva(
  [
    "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full font-semibold tracking-[-0.01em] outline-none",
    "transition-[transform,box-shadow,background-color,border-color,color] duration-300",
    "ease-[cubic-bezier(0.22,1,0.36,1)]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
    "[&_svg]:shrink-0 active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        // Deep navy, with a subtle lift into royal blue on hover.
        default:
          "bg-linear-to-b from-primary to-[hsl(var(--primary)/0.92)] text-primary-foreground shadow-lift hover:-translate-y-0.5 hover:shadow-float",
        // The primary call to action: royal blue into cyan, with a brand glow.
        accent:
          "bg-[linear-gradient(120deg,hsl(var(--accent))_0%,hsl(var(--accent))_55%,hsl(var(--cyan))_140%)] text-accent-foreground shadow-lift hover:-translate-y-0.5 hover:shadow-glow",
        // Warm gold, reserved for a single highlight action per screen.
        gold:
          "bg-[linear-gradient(120deg,hsl(var(--gold))_0%,hsl(var(--national-deep))_140%)] text-[hsl(var(--primary))] shadow-lift hover:-translate-y-0.5 hover:shadow-float",
        outline:
          "border border-border/80 bg-background/70 backdrop-blur-md hover:border-accent/45 hover:bg-background hover:-translate-y-0.5 hover:shadow-soft",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:-translate-y-0.5",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "rounded-none px-0 text-foreground underline-offset-4 hover:text-accent hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:-translate-y-0.5 hover:brightness-110",
        glass:
          "glass text-foreground shadow-soft hover:-translate-y-0.5 hover:bg-background/85 hover:shadow-lift",
        // For dark sections: a hairline glass button that reads on ink.
        onDark:
          "border border-white/18 bg-white/8 text-white backdrop-blur-md hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/14",
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem] [&_svg]:size-4",
        default: "h-11 px-6 text-sm [&_svg]:size-4",
        lg: "h-13 px-8 text-base [&_svg]:size-5",
        xl: "h-14 px-9 text-base [&_svg]:size-5 sm:h-15 sm:px-10",
        icon: "size-11 [&_svg]:size-5",
        "icon-sm": "size-9 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Slot requires exactly one child, so the spinner is only injected
    // when rendering a real <button>.
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
