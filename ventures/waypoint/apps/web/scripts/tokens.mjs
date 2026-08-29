/**
 * Shared reader for the token blocks in src/app/globals.css — light, and
 * dark's overlay on top of it (ticket 240).
 * Aliases (`--red: var(--blush-ink)`) resolve to the hex they point at.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const CSS_PATH = fileURLToPath(
  new URL("../src/app/globals.css", import.meta.url),
);

export function readCss() {
  return readFileSync(CSS_PATH, "utf8");
}

export const LIGHT = ":root {";
export const DARK = ':root[data-theme="dark"] {';

export function rootBlock(css, selector = LIGHT) {
  const start = css.indexOf(selector);
  const end = css.indexOf("\n}", start);
  return { start, end, text: css.slice(start, end) };
}

function declarations(css, selector) {
  const raw = new Map();
  for (const [, name, value] of rootBlock(css, selector).text.matchAll(
    /^\s*--([\w-]+):\s*([^;]+);/gm,
  )) {
    raw.set(name, value.trim());
  }
  return raw;
}

/**
 * Every token as a hex, for one theme. Dark restates only the values that
 * change, so it is read as an overlay on light — exactly how the cascade sees
 * it, and the reason an alias needs no dark counterpart.
 */
export function readTokens(css = readCss(), theme = "light") {
  const raw = declarations(css, LIGHT);
  if (theme === "dark") {
    for (const [name, value] of declarations(css, DARK)) raw.set(name, value);
  }

  const resolve = (name, seen = new Set()) => {
    const value = raw.get(name);
    if (value === undefined || seen.has(name)) return null;
    const alias = value.match(/^var\(--([\w-]+)\)$/);
    if (alias) return resolve(alias[1], seen.add(name));
    return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
  };

  const out = new Map();
  for (const name of raw.keys()) {
    const hex = resolve(name);
    if (hex) out.set(name, hex);
  }
  return out;
}

/** WCAG 2.1 relative luminance / contrast ratio. */
export function contrast(a, b) {
  const lum = (hex) => {
    const channel = (n) => {
      const c = n / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const [r, g, b2] = [1, 3, 5].map((i) =>
      channel(parseInt(hex.slice(i, i + 2), 16)),
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
