/**
 * Theme plumbing, shared by the server (the anti-flash script) and the client
 * (the toggle). Deliberately dependency-free — the whole thing is a class on
 * <html> plus one localStorage key, which `next-themes` would also do but at
 * the cost of another package.
 */

export const THEME_STORAGE_KEY = "np-theme";

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

/** The two themes that can actually be painted. "system" resolves to one. */
export type ResolvedTheme = "light" | "dark";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * Runs before the first paint, from a blocking inline <script> in <head>.
 *
 * This has to be inline and synchronous: if the class were applied after
 * hydration, every visitor who prefers dark would get a white flash first.
 * That is also why <html> carries `suppressHydrationWarning` — the server
 * cannot know which class this will add.
 *
 * Kept deliberately tiny and defensive; a browser with localStorage disabled
 * (Safari private mode throws on access) must still render, just in the
 * system theme.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = null;
    try { stored = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch (e) {}
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Anything that is not exactly 'light' or 'dark' means "follow the OS" —
    // including a missing key and any value we do not recognise. This has to
    // match ThemeProvider's isTheme() fallback exactly, or a stale value would
    // paint one theme and then flip to the other on hydration.
    var dark = stored === 'dark' || (stored !== 'light' && prefersDark);
    var root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`.trim();

/** Applies a theme to the document. Safe to call on every change. */
export function applyTheme(theme: Theme): ResolvedTheme {
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const resolved: ResolvedTheme =
    theme === "dark" || (theme === "system" && prefersDark) ? "dark" : "light";

  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  // Tells the browser which palette to use for form controls and scrollbars.
  root.style.colorScheme = resolved;

  // The static <meta name="theme-color"> pair in the layout keys off
  // prefers-color-scheme, so it would disagree with an explicit override.
  // Mobile browsers tint the address bar from this.
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]:not([media])',
  );
  const colour = resolved === "dark" ? "#0a1420" : "#ffffff";
  if (meta) {
    meta.content = colour;
  } else {
    const created = document.createElement("meta");
    created.name = "theme-color";
    created.content = colour;
    document.head.appendChild(created);
  }

  return resolved;
}
