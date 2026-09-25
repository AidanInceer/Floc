/**
 * The web view's tokens (#408). The editor's stylesheet reads the same CSS
 * variables the website declares; inside the phone there is no globals.css,
 * so the values are written here from @floc/core, flattened for one theme.
 */
import { fontStacks, resolveTokens, type Theme } from "@floc/core/design/tokens";

// Why these three are rewritten: the web's stacks lead with next/font's family, which a web view never has.
const FACES = { display: fontStacks.display, sans: fontStacks.sans, type: fontStacks.type };

/** The website's type scale, so a page reads the same size on both. */
const TEXT = { xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 25, "2xl": 31, "3xl": 39 };

const stack = (names: readonly string[]) => names.map((name) => (name === "System" ? "system-ui" : `"${name}"`)).join(", ");

export type FontFiles = Partial<Record<"display" | "sans" | "sansBold" | "type", string>>;

function faces(files: FontFiles): string {
  const face = (family: string, weight: number, url: string | undefined) =>
    url ? `@font-face { font-family: "${family}"; font-weight: ${weight}; src: url("${url}"); }` : "";
  return [
    face("Bricolage Grotesque", 600, files.display),
    face("Instrument Sans", 400, files.sans),
    face("Instrument Sans", 600, files.sansBold),
    face("DM Mono", 400, files.type),
  ].filter(Boolean).join("\n");
}

export function pageCss(theme: Theme, files: FontFiles = {}): string {
  const tokens = Object.entries(resolveTokens(theme)).filter(([name]) => !(name in FACES));
  const declarations = [
    ...tokens.map(([name, value]) => `--${name}: ${value};`),
    ...Object.entries(FACES).map(([name, names]) => `--${name}: ${stack(names)};`),
    ...Object.entries(TEXT).map(([name, px]) => `--text-${name}: ${px}px;`),
  ];
  return `${faces(files)}
:root { color-scheme: ${theme}; ${declarations.join(" ")} }
html, body { margin: 0; padding: 0; background: var(--sheet); color: var(--ink); font-family: var(--sans); -webkit-text-size-adjust: 100%; }
button { font: inherit; color: inherit; background: none; border: 0; }`;
}
