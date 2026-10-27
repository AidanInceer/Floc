import { existsSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { darkTokens, fontStacks, lightTokens } from "@floc/core/design/tokens";

export const MIME: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

export const mimeOf = (file: string): string => MIME[extname(file)] ?? "application/octet-stream";

const declare = (tokens: Record<string, string>) => Object.entries(tokens).map(([k, v]) => `  --${k}: ${v};`).join("\n");

// Why: the web's font tokens lead with next/font's generated family, which a static page never has.
export const tokensCss = `:root {
  --font-display-face: "${fontStacks.display[0]}";
  --font-body-face: "${fontStacks.sans[0]}";
  --font-data-face: "${fontStacks.type[0]}";
${declare(lightTokens)}
}
:root[data-theme="dark"] {
${declare(darkTokens)}
}
`;

export interface Roots {
  repo: string;
  studio: string;
}

export function studioFile({ repo, studio }: Roots, url: string): string | undefined {
  const from = url.startsWith("/floc/") ? repo
    : url.startsWith("/shared/") || url.startsWith("/_studio/") ? studio
    : join(studio, "scenes");
  const file = resolve(from, `.${url}`);
  if (!file.startsWith(from + sep) || !existsSync(file) || statSync(file).isDirectory()) return undefined;
  return file;
}
