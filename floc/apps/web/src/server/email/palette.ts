/**
 * Colour and type for email, read from the tokens when the mail is drawn (#653, ADR-062).
 *
 * Why inline and a class both: a mail client keeps inline styles but may drop a <style> block, so the light
 * values ride inline and the dark ones override by class under `prefers-color-scheme` (Apple Mail, Outlook
 * on Mac and phones). Gmail ignores that query and inverts by its own rules.
 */
import { lightTokens, resolveTokens, type Theme } from "@floc/core/design/tokens";

type TokenName = keyof ReturnType<typeof resolveTokens>;

const PROPERTY = { bg: "background-color", fg: "color", bd: "border-color" } as const;
type Role = `${keyof typeof PROPERTY}-${string}`;

function declaration(role: Role, values: Record<TokenName, string>): string {
  const [prefix, ...rest] = role.split("-");
  const name = rest.join("-");
  if (!(name in values)) throw new Error(`No token for ${role}`);
  return `${PROPERTY[prefix as keyof typeof PROPERTY]}:${values[name as TokenName]}`;
}

/** One mail's painter: `paint("bg-sheet fg-ink", "padding:8px")` gives the class and style attributes. */
export function painter(theme: Theme) {
  const values = resolveTokens(theme);
  const dark = resolveTokens("dark");
  const used = new Set<Role>();

  const paint = (roles: string, style = "", extraClass = "") => {
    const list = roles.split(/\s+/).filter(Boolean) as Role[];
    list.forEach((r) => used.add(r));
    const colours = list.map((r) => declaration(r, values));
    const cls = [...list, extraClass].filter(Boolean).join(" ");
    // Why: colours go last, so a `border:1px solid` shorthand in `style` cannot reset the border colour.
    return ` class="${cls}" style="${[style, ...colours].filter(Boolean).join(";")}"`;
  };

  const darkCss = () =>
    [...used].map((r) => `.${r}{${declaration(r, dark)} !important}`).join("");

  return { paint, darkCss };
}

/** The token stacks without next/font's generated family, which a mail client cannot see. */
function stack(name: "display" | "sans" | "type"): string {
  return lightTokens[name]
    .split(",")
    .map((f) => f.trim())
    .filter((f) => !f.startsWith("var("))
    .join(",")
    .replace(/"/g, "'");
}

export const FACE = { display: stack("display"), sans: stack("sans"), mono: stack("type") };

/** The three faces from Floc's own files (#653): no outside font service sees who opened a mail (ADR-013). */
export function fontFaces(base: string): string {
  const face = (family: string, file: string, weight: string) =>
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(${new URL(`/fonts/${file}`, base)}) format('woff2');}`;
  return [
    face("Red Hat Display", "red-hat-display-latin.woff2", "800"),
    face("Red Hat Text", "red-hat-text-latin.woff2", "300 700"),
    face("Red Hat Mono", "red-hat-mono-latin.woff2", "300 700"),
  ].join("");
}
