/**
 * "Skip to content" link — WCAG 2.4.1 (Bypass Blocks).
 *
 * Visually hidden until it receives keyboard focus, so it costs sighted mouse
 * users nothing while letting keyboard and screen-reader users jump past the
 * header and its navigation on every page.
 *
 * It must be the first focusable element in the document, so render it before
 * the header. The target needs `tabIndex={-1}` for focus to actually move
 * there in Safari and Firefox.
 */
export function SkipToContent({ href = "#main-content" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only z-[100] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-accent-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
