#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const assets = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

const PAPER = "#fafafa";
const PEN = "#4e68d8";

const CHEVRONS = [
  "M3.4 16.5 7 12.9 10.6 16.5",
  "M10.4 10 14 6.4 17.6 10",
  "M17.4 16.5 21 12.9 24.6 16.5",
];

function mark({ width, height, fraction, background }) {
  const scale = (Math.min(width, height) * fraction) / 28;
  const x = (width - 28 * scale) / 2;
  const y = (height - 22 * scale) / 2;
  const paths = CHEVRONS.map((d) => `<path d="${d}" />`).join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      (background ? `<rect width="${width}" height="${height}" fill="${background}" />` : "") +
      `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${PEN}"` +
      ` stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`,
  );
}

const files = [
  ["icon.png", { width: 1024, height: 1024, fraction: 0.74, background: PAPER }],
  ["adaptive-icon.png", { width: 1024, height: 1024, fraction: 0.5, background: null }],
  ["splash.png", { width: 1284, height: 2778, fraction: 0.34, background: PAPER }],
];

mkdirSync(assets, { recursive: true });
for (const [name, options] of files) {
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
