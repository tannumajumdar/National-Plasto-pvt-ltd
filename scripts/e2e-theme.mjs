/**
 * Theme switching tests.
 *
 * The anti-flash snippet is a string of hand-written JS that runs before React
 * exists, so nothing else in the app can catch a mistake in it. This executes
 * it against a minimal DOM stub across every combination of stored preference
 * and OS preference, then checks `applyTheme` agrees with it.
 *
 * Run:  npx tsx --conditions=react-server scripts/e2e-theme.mjs
 */
import vm from "vm";

const results = [];
let currentFlow = "";
function flow(n) {
  currentFlow = n;
  console.log(`\n=== ${n} ===`);
}
function check(label, condition, detail) {
  const passed = Boolean(condition);
  results.push({ flow: currentFlow, label, passed, detail });
  console.log(`${passed ? "  PASS" : "  FAIL"}  ${label}`);
  if (!passed && detail !== undefined) console.log(`        ${detail}`);
}

/* ---------------- minimal DOM ---------------- */

function makeDom({ stored, prefersDark, storageThrows = false }) {
  const classes = new Set();
  const metas = [];

  const root = {
    classList: {
      toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    style: {},
  };

  const sandbox = {
    document: {
      documentElement: root,
      head: { appendChild: (m) => metas.push(m) },
      createElement: () => ({ name: "", content: "" }),
      querySelector: () => metas.find((m) => m.name === "theme-color") ?? null,
    },
    window: {
      matchMedia: (query) => ({
        matches: query.includes("dark") ? prefersDark : false,
        addEventListener() {},
        removeEventListener() {},
      }),
    },
    localStorage: {
      getItem: (k) => {
        if (storageThrows) throw new Error("SecurityError: localStorage is disabled");
        return k === "np-theme" ? stored : null;
      },
      setItem: () => {
        if (storageThrows) throw new Error("SecurityError");
      },
    },
  };
  sandbox.globalThis = sandbox;
  return { sandbox, root, classes, metas };
}

async function main() {
  const { THEME_INIT_SCRIPT, applyTheme, isTheme, THEMES, THEME_STORAGE_KEY } =
    await import("../src/lib/theme.ts");

  /* ---------------- the pre-paint snippet ---------------- */
  flow("Anti-flash snippet — runs before React, must never throw");

  const cases = [
    { stored: null, prefersDark: false, dark: false, why: "first visit, OS light" },
    { stored: null, prefersDark: true, dark: true, why: "first visit, OS dark" },
    { stored: "light", prefersDark: true, dark: false, why: "explicit light overrides a dark OS" },
    { stored: "dark", prefersDark: false, dark: true, why: "explicit dark overrides a light OS" },
    { stored: "system", prefersDark: true, dark: true, why: "system follows a dark OS" },
    { stored: "system", prefersDark: false, dark: false, why: "system follows a light OS" },
    { stored: "garbage", prefersDark: true, dark: true, why: "unknown value falls back to the OS" },
    { stored: "garbage", prefersDark: false, dark: false, why: "unknown value falls back to the OS" },
  ];

  for (const c of cases) {
    const { sandbox, classes, root } = makeDom(c);
    let threw = null;
    try {
      vm.runInNewContext(THEME_INIT_SCRIPT, sandbox);
    } catch (e) {
      threw = e;
    }
    check(
      `${c.why} -> ${c.dark ? "dark" : "light"}`,
      !threw && classes.has("dark") === c.dark,
      threw ? `threw ${threw.message}` : `classList has dark = ${classes.has("dark")}`,
    );
    check(
      `   colorScheme set to ${c.dark ? "dark" : "light"}`,
      root.style.colorScheme === (c.dark ? "dark" : "light"),
      `got ${root.style.colorScheme}`,
    );
  }

  const blocked = makeDom({ stored: "dark", prefersDark: false, storageThrows: true });
  let blockedThrew = null;
  try {
    vm.runInNewContext(THEME_INIT_SCRIPT, blocked.sandbox);
  } catch (e) {
    blockedThrew = e;
  }
  check(
    "survives localStorage being blocked (Safari private mode)",
    !blockedThrew,
    blockedThrew ? `threw ${blockedThrew.message}` : undefined,
  );
  check(
    "falls back to the OS theme when storage is unreadable",
    blocked.classes.has("dark") === false,
    "OS prefers light, so the page must render light",
  );

  check("snippet does not reference React or any import", !/require|import\s/.test(THEME_INIT_SCRIPT));
  check(
    "snippet reads the same storage key the app writes",
    THEME_INIT_SCRIPT.includes(THEME_STORAGE_KEY),
    THEME_STORAGE_KEY,
  );

  /* ---------------- applyTheme ---------------- */
  flow("applyTheme — must agree with the snippet");

  for (const c of cases.filter((x) => x.stored && x.stored !== "garbage")) {
    const { sandbox, classes } = makeDom(c);
    // applyTheme touches the real globals, so borrow the stub for the call.
    const savedDoc = globalThis.document;
    const savedWin = globalThis.window;
    globalThis.document = sandbox.document;
    globalThis.window = sandbox.window;
    try {
      const resolved = applyTheme(c.stored);
      check(
        `applyTheme("${c.stored}") with OS ${c.prefersDark ? "dark" : "light"} -> ${c.dark ? "dark" : "light"}`,
        resolved === (c.dark ? "dark" : "light") && classes.has("dark") === c.dark,
        `resolved=${resolved} classHasDark=${classes.has("dark")}`,
      );
    } finally {
      globalThis.document = savedDoc;
      globalThis.window = savedWin;
    }
  }

  const metaCase = makeDom({ stored: "dark", prefersDark: false });
  {
    const savedDoc = globalThis.document;
    const savedWin = globalThis.window;
    globalThis.document = metaCase.sandbox.document;
    globalThis.window = metaCase.sandbox.window;
    try {
      applyTheme("dark");
      const meta = metaCase.metas.find((m) => m.name === "theme-color");
      check("theme-color meta is created for the address bar", Boolean(meta), JSON.stringify(metaCase.metas));
      check("theme-color matches the dark surface", meta?.content === "#0a1420", meta?.content);
    } finally {
      globalThis.document = savedDoc;
      globalThis.window = savedWin;
    }
  }

  /* ---------------- guards ---------------- */
  flow("Theme value validation");

  check("light is a theme", isTheme("light"));
  check("dark is a theme", isTheme("dark"));
  check("system is a theme", isTheme("system"));
  check("nonsense is rejected", !isTheme("neon"));
  check("null is rejected", !isTheme(null));
  check("exactly three themes are offered", THEMES.length === 3, JSON.stringify(THEMES));

  const failed = results.filter((r) => !r.passed);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TOTAL ${results.length}   PASS ${results.length - failed.length}   FAIL ${failed.length}`);
  if (failed.length) {
    console.log("\nFAILURES:");
    for (const f of failed) console.log(`  [${f.flow}] ${f.label}\n      ${f.detail ?? ""}`);
  }
  console.log("=".repeat(60));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error("CRASHED:", e);
  process.exit(2);
});
