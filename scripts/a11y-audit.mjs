/**
 * Accessibility audit over the real rendered HTML.
 *
 * Static checks only — it catches the structural, machine-detectable problems
 * (missing alt text, unlabelled controls, heading order, landmarks, document
 * language). It cannot judge colour contrast, focus visibility, screen-reader
 * flow or keyboard traps; those still need a browser and a human.
 *
 * Run:  node scripts/a11y-audit.mjs
 */
const BASE = process.env.BASE ?? "http://localhost:3000";

const PAGES = [
  "/",
  "/products",
  "/collections",
  "/collections/next",
  "/about",
  "/contact",
  "/cart",
  "/login",
  "/register",
  "/forgot-password",
  "/search?q=chair",
  "/wishlist",
];

const findings = [];
function note(page, severity, rule, detail) {
  findings.push({ page, severity, rule, detail });
}

/* ---------- crude but dependency-free HTML helpers ---------- */

function tagsOf(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>`, "gi");
  return html.match(re) ?? [];
}

function attr(tagHtml, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i");
  const m = re.exec(tagHtml);
  return m ? m[1] : null;
}

function hasAttr(tagHtml, name) {
  return new RegExp(`\\b${name}\\b`, "i").test(tagHtml);
}

/**
 * An element has an accessible name if it carries one directly, or if a
 * <label for="..."> elsewhere in the document points at its id — which is how
 * Radix's Checkbox (a button with role="checkbox") gets its name.
 */
function hasAccessibleName(tagHtml, documentHtml) {
  if (attr(tagHtml, "aria-label")?.trim()) return true;
  if (attr(tagHtml, "aria-labelledby")) return true;
  if (attr(tagHtml, "title")?.trim()) return true;

  const id = attr(tagHtml, "id");
  if (id && new RegExp(`<label[^>]*\\bfor\\s*=\\s*"${id}"`, "i").test(documentHtml)) return true;

  return false;
}

/** Strips inline SVG and script/style so their contents do not confuse checks. */
function stripNoise(html) {
  return html
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
}

/* ---------- checks ---------- */

function auditPage(page, html) {
  const clean = stripNoise(html);

  // 1. Document language
  const htmlTag = tagsOf(html, "html")[0] ?? "";
  if (!attr(htmlTag, "lang")) {
    note(page, "serious", "html-has-lang", "<html> has no lang attribute");
  }

  // 2. Page title
  const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
  if (!title) note(page, "serious", "document-title", "page has no <title>");

  // 3. Images need alt (empty alt is fine — it means decorative)
  for (const img of tagsOf(clean, "img")) {
    if (!hasAttr(img, "alt")) {
      note(page, "critical", "image-alt", `<img> without alt: ${img.slice(0, 110)}`);
    }
  }

  // 4. Form controls need an accessible name.
  //    aria-hidden controls are exempt: Radix renders a hidden proxy input
  //    behind each Select/Checkbox purely so native form submission works,
  //    and deliberately removes it from the accessibility tree.
  for (const input of [...tagsOf(clean, "input"), ...tagsOf(clean, "textarea"), ...tagsOf(clean, "select")]) {
    const type = (attr(input, "type") ?? "").toLowerCase();
    if (type === "hidden" || type === "submit" || type === "button") continue;
    if (attr(input, "aria-hidden") === "true") continue;
    // display:none is removed from the accessibility tree entirely — Radix
    // renders such inputs purely so native form submission keeps working.
    if (/display\s*:\s*none/i.test(attr(input, "style") ?? "")) continue;

    if (!hasAccessibleName(input, clean)) {
      note(page, "critical", "control-name", `control without a label: ${input.slice(0, 110)}`);
    }
  }

  // 5. Buttons and links need discernible text
  const buttonRe = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let m;
  while ((m = buttonRe.exec(clean)) !== null) {
    const [, attrs, inner] = m;
    const tag = `<button ${attrs}>`;
    if (attr(tag, "aria-hidden") === "true") continue;

    const text = inner.replace(/<[^>]*>/g, "").trim();
    if (!text && !hasAccessibleName(tag, clean)) {
      note(page, "critical", "button-name", `<button> with no text or aria-label: ${attrs.slice(0, 100)}`);
    }
  }

  const linkRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  while ((m = linkRe.exec(clean)) !== null) {
    const [, attrs, inner] = m;
    if (!/\bhref\b/i.test(attrs)) continue;
    const tag = `<a ${attrs}>`;
    if (attr(tag, "aria-hidden") === "true") continue;

    const text = inner.replace(/<[^>]*>/g, "").trim();
    if (!text && !hasAccessibleName(tag, clean)) {
      note(page, "serious", "link-name", `<a> with no text or aria-label: ${attrs.slice(0, 100)}`);
    }
  }

  // 6. Heading structure
  const headings = [];
  const hRe = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  while ((m = hRe.exec(clean)) !== null) {
    headings.push({ level: Number(m[1]), text: m[2].replace(/<[^>]*>/g, "").trim() });
  }

  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0) note(page, "moderate", "page-has-h1", "no <h1> on the page");
  if (h1s.length > 1) {
    note(page, "moderate", "one-h1", `${h1s.length} <h1> elements: ${h1s.map((h) => h.text.slice(0, 30)).join(" | ")}`);
  }

  for (let i = 1; i < headings.length; i++) {
    const jump = headings[i].level - headings[i - 1].level;
    if (jump > 1) {
      note(
        page,
        "moderate",
        "heading-order",
        `h${headings[i - 1].level} -> h${headings[i].level} ("${headings[i].text.slice(0, 40)}")`,
      );
    }
  }

  // 7. Landmarks
  if (!/<main\b/i.test(clean) && !/role\s*=\s*"main"/i.test(clean)) {
    note(page, "moderate", "landmark-main", "no <main> landmark");
  }
  if (!/<nav\b/i.test(clean) && !/role\s*=\s*"navigation"/i.test(clean)) {
    note(page, "minor", "landmark-nav", "no <nav> landmark");
  }

  // 8. Skip link — first focusable should let keyboard users bypass the nav
  if (!/skip\s+to\s+(main|content)/i.test(clean)) {
    note(page, "moderate", "skip-link", "no visible-on-focus “skip to content” link found");
  }

  // 9. Viewport must not block zoom
  const viewport = tagsOf(html, "meta").find((t) => /name\s*=\s*"viewport"/i.test(t));
  if (viewport) {
    const content = attr(viewport, "content") ?? "";
    if (/user-scalable\s*=\s*no/i.test(content) || /maximum-scale\s*=\s*1\b/i.test(content)) {
      note(page, "serious", "meta-viewport", `zoom is restricted: ${content}`);
    }
  }

  // 10. Positive tabindex reorders focus unpredictably
  const positiveTab = clean.match(/tabindex\s*=\s*"([1-9]\d*)"/gi);
  if (positiveTab) {
    note(page, "serious", "tabindex", `positive tabindex used: ${[...new Set(positiveTab)].join(", ")}`);
  }
}

/* ---------- run ---------- */

async function main() {
  try {
    const probe = await fetch(`${BASE}/api/auth/me`);
    if (!probe.ok) throw new Error();
  } catch {
    console.error(`\nNo server at ${BASE}. Start it with:  npm run dev\n`);
    process.exit(1);
  }

  console.log(`\nAuditing ${PAGES.length} pages at ${BASE}\n`);

  for (const page of PAGES) {
    const res = await fetch(BASE + page);
    if (!res.ok) {
      note(page, "error", "page-load", `HTTP ${res.status}`);
      continue;
    }
    auditPage(page, await res.text());
    process.stdout.write(".");
  }
  console.log("\n");

  const order = { critical: 0, serious: 1, moderate: 2, minor: 3, error: 0 };
  const byRule = new Map();
  for (const f of findings) {
    const key = `${f.severity}|${f.rule}`;
    if (!byRule.has(key)) byRule.set(key, []);
    byRule.get(key).push(f);
  }

  const sorted = [...byRule.entries()].sort(
    (a, b) => order[a[0].split("|")[0]] - order[b[0].split("|")[0]],
  );

  if (sorted.length === 0) {
    console.log("No structural accessibility problems detected.");
  } else {
    for (const [key, items] of sorted) {
      const [severity, rule] = key.split("|");
      console.log(`\n[${severity.toUpperCase()}] ${rule} — ${items.length} occurrence(s)`);
      const pages = [...new Set(items.map((i) => i.page))];
      console.log(`  pages: ${pages.join(", ")}`);
      for (const detail of [...new Set(items.map((i) => i.detail))].slice(0, 4)) {
        console.log(`    - ${detail}`);
      }
      if (new Set(items.map((i) => i.detail)).size > 4) {
        console.log(`    …and ${new Set(items.map((i) => i.detail)).size - 4} more`);
      }
    }
  }

  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0, error: 0 };
  for (const f of findings) counts[f.severity]++;

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `critical ${counts.critical}   serious ${counts.serious}   moderate ${counts.moderate}   minor ${counts.minor}   load-errors ${counts.error}`,
  );
  console.log(
    "\nStatic checks only. Colour contrast, focus visibility, keyboard traps\nand screen-reader flow still need a browser and a human.",
  );
  console.log("=".repeat(60));

  process.exit(counts.critical > 0 || counts.error > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("CRASHED:", e);
  process.exit(2);
});
