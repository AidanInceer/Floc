#!/usr/bin/env node
/**
 * Draws the store icons from the wordmark's chevrons (ticket 292), so the app
 * icon cannot drift from `wordmark.tsx`. Rerun after either changes:
 *   node scripts/make-icons.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const assets = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

const PAPER = "#fafafa";
const PEN = "#4e68d8";

// The wordmark's own geometry, in its own 26x20 box. Copied, not imported:
// `@floc/core` holds token values, not artwork, and the app must not reach
// into the web app's components.
const CHEVRONS = [
  "M3 14 6.5 10.5 10 14",
  "M9.5 8.5 13 5 16.5 8.5",
  "M16 14 19.5 10.5 23 14",
];

/** `fraction` is how much of the shorter side the mark spans. */
function mark({ width, height, fraction, background }) {
  const scale = (Math.min(width, height) * fraction) / 26;
  const x = (width - 26 * scale) / 2;
  const y = (height - 20 * scale) / 2;
  const paths = CHEVRONS.map((d) => `<path d="${d}" />`).join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      (background ? `<rect width="${width}" height="${height}" fill="${background}" />` : "") +
      `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${PEN}"` +
      ` stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`,
  );
}

const files = [
  // Full bleed: iOS rounds the corners itself, so the paper must reach the edge.
  ["icon.png", { width: 1024, height: 1024, fraction: 0.74, background: PAPER }],
  // Android masks this to a circle and supplies the background separately, so
  // the mark stays inside the safe centre and the layer is transparent.
  ["adaptive-icon.png", { width: 1024, height: 1024, fraction: 0.5, background: null }],
  ["splash.png", { width: 1284, height: 2778, fraction: 0.34, background: PAPER }],
];

mkdirSync(assets, { recursive: true });
for (const [name, options] of files) {
  // The App Store rejects an icon carrying an alpha channel; the Android
  // foreground layer needs one.
  const image = sharp(mark(options));
  const png = await (options.background
    ? image.flatten({ background: options.background }).removeAlpha()
    : image
  )
    .png()
    .toBuffer();
  writeFileSync(join(assets, name), png);
  console.log(`${name}  ${options.width}x${options.height}  ${png.length} bytes`);
}
