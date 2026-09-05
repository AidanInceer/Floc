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
