/**
 * Deterministic branded placeholders.
 *
 * The source PDF supplied product names only — no photography. Rather than
 * shipping grey boxes, every product gets a stable, collection-tinted graphic
 * derived from its own name, so the catalogue looks intentional until an
 * admin uploads real imagery.
 */

export type AccentToken = "next" | "national" | "sapphire" | "captain";

const ACCENT_STOPS: Record<AccentToken, [string, string, string]> = {
  next: ["#0B3F86", "#1289E0", "#5CC7F5"],
  national: ["#B25213", "#F08A1D", "#FFC24A"],
  sapphire: ["#2B2A8C", "#5B52D6", "#9A8CF0"],
  captain: ["#0E5A4A", "#12876E", "#4FC3A1"],
};

/** Stable 32-bit hash — same name always yields the same artwork. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface PlaceholderConfig {
  stops: [string, string, string];
  /** 0–3, selects which abstract product silhouette to draw. */
  variant: number;
  rotation: number;
  initials: string;
}

export function placeholderConfig(name: string, accent: AccentToken): PlaceholderConfig {
  const h = hashString(name);
  return {
    stops: ACCENT_STOPS[accent] ?? ACCENT_STOPS.national,
    variant: h % 4,
    rotation: ((h >> 3) % 14) - 7,
    initials: name
      .split(/\s+/)
      .filter((w) => /[a-z0-9]/i.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join(""),
  };
}

/**
 * Server-renderable SVG string, used for Open Graph images and anywhere a
 * real <img src> is required.
 */
export function placeholderSvg(name: string, accent: AccentToken, size = 800): string {
  const { stops, variant, rotation, initials } = placeholderConfig(name, accent);
  const id = hashString(name).toString(36);

  const shapes = [
    `<rect x="230" y="250" width="340" height="300" rx="42" />
     <rect x="268" y="188" width="264" height="96" rx="34" />`,
    `<rect x="212" y="300" width="376" height="70" rx="34" />
     <rect x="248" y="366" width="42" height="188" rx="20" />
     <rect x="510" y="366" width="42" height="188" rx="20" />`,
    `<rect x="240" y="180" width="320" height="384" rx="38" />
     <rect x="286" y="248" width="228" height="20" rx="10" opacity=".45" />
     <rect x="286" y="330" width="228" height="20" rx="10" opacity=".45" />
     <rect x="286" y="412" width="228" height="20" rx="10" opacity=".45" />`,
    `<circle cx="400" cy="330" r="132" />
     <rect x="352" y="430" width="96" height="150" rx="44" />`,
  ][variant];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="${size}" height="${size}" role="img" aria-label="${escapeXml(name)}">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${stops[0]}"/>
      <stop offset="55%" stop-color="${stops[1]}"/>
      <stop offset="100%" stop-color="${stops[2]}"/>
    </linearGradient>
    <linearGradient id="fg${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity=".62"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg${id})"/>
  <circle cx="640" cy="150" r="210" fill="#ffffff" opacity=".10"/>
  <circle cx="140" cy="690" r="180" fill="#000000" opacity=".08"/>
  <g transform="rotate(${rotation} 400 380)" fill="url(#fg${id})">${shapes}</g>
  <text x="400" y="712" text-anchor="middle" font-family="system-ui,sans-serif"
        font-size="58" font-weight="700" fill="#ffffff" opacity=".92">${escapeXml(initials)}</text>
</svg>`;
}

export function placeholderDataUri(name: string, accent: AccentToken): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(placeholderSvg(name, accent))}`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Tiny blurred gradient used as a Next/Image blurDataURL. */
export function blurDataUri(accent: AccentToken): string {
  const [a, b] = ACCENT_STOPS[accent] ?? ACCENT_STOPS.national;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="${a}"/><circle cx="6" cy="2" r="4" fill="${b}" opacity=".8"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
