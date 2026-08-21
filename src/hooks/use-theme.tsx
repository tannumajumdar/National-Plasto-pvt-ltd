"use client";

import * as React from "react";

import {
  applyTheme,
  isTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

interface ThemeContextValue {
  /** What the user chose: light, dark, or follow the OS. */
  theme: Theme;
  /** What is actually painted right now. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  /** True once mounted — render theme-dependent icons only after this. */
  mounted: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/**
 * Theme state for the whole app.
 *
 * The class on <html> is applied before paint by THEME_INIT_SCRIPT, so this
 * provider is only responsible for *changes* and for telling components what
 * is current. It reads the stored preference on mount rather than during
 * render, so the server and the first client render agree.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Private-mode Safari throws on access; fall back to system.
    }
    const initial: Theme = isTheme(stored) ? stored : "system";
    setThemeState(initial);
    setResolvedTheme(applyTheme(initial));
    setMounted(true);
  }, []);

  // Follow the OS while the preference is "system".
  React.useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedTheme(applyTheme("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  // Keep other tabs in step.
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const next: Theme = isTheme(e.newValue) ? e.newValue : "system";
      setThemeState(next);
      setResolvedTheme(applyTheme(next));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    setResolvedTheme(applyTheme(next));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Not persisting is survivable; the choice still applies for this page.
    }
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme, mounted }),
    [theme, resolvedTheme, setTheme, mounted],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
