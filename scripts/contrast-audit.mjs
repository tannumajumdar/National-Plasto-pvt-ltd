/**
 * WCAG contrast audit of the design-system token pairs, in both themes.
 *
 * Reads the HSL custom properties straight out of globals.css, so it stays
 * true as the palette changes. Static analysis of declared pairs — it cannot
 * know which pairs the components actually put together, so treat it as a
 * shortlist to eyeball, not a verdict.
 *
 * Run:  node scripts/contrast-audit.mjs
 */
import { readFileSync } from "fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

function tokensIn(selector) {
  const re = new RegExp(`${selector}\\s*\\{(.*?)\\n\\}`, "s");
  const block = re.exec(css)?.[1] ?? "";
  const out = {};
  for (const [, name, value] of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

const light = tokensIn(":root");
const dark = { ...light, ...tokensIn("\\.dark") };

/** "213 65% 11%" -> [r,g,b] 0-255 */
function hslToRgb(value) {
  const m = /^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;

  if (s === 0) return [l * 255, l * 255, l * 255];

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
}

function relativeLuminance([r, g, b]) {
  const f = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS = [
  ["--background", "--foreground", "body text"],
  ["--card", "--card-foreground", "card text"],
  ["--popover", "--popover-foreground", "popover text"],
  ["--primary", "--primary-foreground", "primary button"],
  ["--secondary", "--secondary-foreground", "secondary button"],
  ["--accent", "--accent-foreground", "accent button"],
  ["--muted", "--muted-foreground", "muted text"],
  ["--destructive", "--destructive-foreground", "destructive button"],
  ["--success", "--success-foreground", "success badge"],
  ["--warning", "--warning-foreground", "warning badge"],
  ["--background", "--muted-foreground", "secondary text on page"],
];

let failures = 0;

for (const [themeName, tokens] of [
  ["LIGHT", light],
  ["DARK", dark],
]) {
  console.log(`\n${themeName}`);
  console.log("-".repeat(66));
  for (const [bgToken, fgToken, label] of PAIRS) {
    const bg = hslToRgb(tokens[bgToken] ?? "");
    const fg = hslToRgb(tokens[fgToken] ?? "");
    if (!bg || !fg) {
      console.log(`  ?      ${label.padEnd(26)} (token missing)`);
      continue;
    }
    const ratio = contrast(bg, fg);
    // 4.5:1 is AA for normal text; 3:1 is AA for large text and UI components.
    const verdict = ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA-large" : "FAIL";
    if (verdict === "FAIL") failures++;
    const flag = verdict === "AA" ? " " : verdict === "AA-large" ? "!" : "X";
    console.log(
      `  ${flag} ${ratio.toFixed(2).padStart(5)}:1  ${label.padEnd(26)} ${verdict}`,
    );
  }
}

console.log(`\n${"=".repeat(66)}`);
console.log(
  failures === 0
    ? "No pair falls below 3:1."
    : `${failures} pair(s) below 3:1 — too low even for large text.`,
);
console.log(
  "AA-large (3:1–4.5:1) is fine for big headings, badges and icons,\nbut not for body copy. Verify those in the browser.",
);
console.log("=".repeat(66));
