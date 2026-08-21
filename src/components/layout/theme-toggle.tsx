"use client";

import * as React from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { THEMES, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun; hint: string }[] = [
  { value: "light", label: "Light", icon: Sun, hint: "Always light" },
  { value: "dark", label: "Dark", icon: Moon, hint: "Always dark" },
  { value: "system", label: "System", icon: Monitor, hint: "Match my device" },
];

/**
 * Light / dark / system switcher.
 *
 * Three options rather than a two-way flip: "system" is the honest default,
 * and a plain toggle would silently override whatever the visitor already
 * told their operating system they prefer.
 *
 * Until `mounted`, the icon renders in a fixed state. The server cannot know
 * the stored preference, so painting the real icon straight away would mean a
 * hydration mismatch on every load.
 */
export function ThemeToggle({
  className,
  inverted = false,
}: {
  className?: string;
  /** For dark surfaces like the admin sidebar. */
  inverted?: boolean;
}) {
  const { theme, resolvedTheme, setTheme, mounted } = useTheme();

  const Icon = !mounted ? Sun : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "grid size-10 place-items-center rounded-full transition-colors",
            inverted
              ? "text-primary-foreground/60 hover:bg-white/10 hover:text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label={
            mounted
              ? `Theme: ${theme}. Change the colour theme.`
              : "Change the colour theme"
          }
        >
          <Icon className="size-5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Colour theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          const active = mounted && theme === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => setTheme(option.value)}
              className="gap-2"
            >
              <OptionIcon className="size-4" />
              <span className="flex-1">{option.label}</span>
              {active && <Check className="size-3.5 text-accent" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A plain two-state flip, for places with no room for a menu — the mobile
 * drawer, for instance. Skips "system" by design: somewhere in the UI the
 * three-way control must still exist.
 */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme, mounted } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={mounted ? `Switch to the ${next} theme` : "Switch colour theme"}
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
      <span>{mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

export { THEMES };
