/**
 * Intro plumbing, shared by the server (the pre-paint script) and the client
 * (the overlay component).
 *
 * The problem this solves: <CompanyIntro> is a client component, so the
 * earliest it can paint anything is after hydration. On a cold load that is a
 * second or more after the homepage itself is on screen, which is why the
 * intro used to appear *after* the page rather than before it.
 *
 * So the decision — does the intro play at all? — is made by a blocking script
 * in <head> instead, and it stamps `data-intro="play"` on <html>. A CSS rule
 * keyed off that attribute paints the navy backdrop with the very first frame,
 * long before React exists. The React overlay then fades in on top of the same
 * colour, so the handover is invisible, and it clears the attribute when the
 * animation ends.
 */

export const INTRO_STORAGE_KEY = "nppl_intro_seen_v1";

/** Attribute the script sets on <html>, and the overlay clears when finished. */
export const INTRO_ATTRIBUTE = "data-intro";

/**
 * If React never clears the attribute — a chunk fails to load, the component
 * throws — the visitor is left staring at a navy rectangle with no way out.
 * The script removes the cover itself after this long, whatever happened.
 */
const FAILSAFE_MS = 12000;

/** The three images the intro shows, preloaded only when it is going to play. */
const INTRO_IMAGES = [
  "/images/company/national-logo.png",
  "/images/company/next-national-logo.png",
  "/images/company/company-photo.jpg",
] as const;

/**
 * Runs before the first paint, from a blocking inline <script> in <head>.
 *
 * Deliberately tiny and defensive: a browser with sessionStorage disabled
 * (Safari private mode throws on access) must still render the site, just
 * without the intro.
 */
export const INTRO_INIT_SCRIPT = `
(function () {
  try {
    var seen = null;
    try { seen = sessionStorage.getItem('${INTRO_STORAGE_KEY}'); } catch (e) {}
    if (seen) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var root = document.documentElement;
    root.setAttribute('${INTRO_ATTRIBUTE}', 'play');

    // Start the images with the document instead of when their stage mounts.
    // The factory photo is revealed 3.2s in, and beginning its download at
    // that moment is what made the reveal hitch.
    ${JSON.stringify(INTRO_IMAGES)}.forEach(function (src) {
      var link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    setTimeout(function () {
      root.removeAttribute('${INTRO_ATTRIBUTE}');
    }, ${FAILSAFE_MS});
  } catch (e) {}
})();
`.trim();
