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

export function painter(theme: Theme) {
  const values = resolveTokens(theme);
  const dark = resolveTokens("dark");
  const used = new Set<Role>();

  const paint = (roles: string, style = "", extraClass = "") => {
    const list = roles.split(/\s+/).filter(Boolean) as Role[];
    list.forEach((r) => used.add(r));
    const colours = list.map((r) => declaration(r, values));
    const cls = [...list, extraClass].filter(Boolean).join(" ");
    return ` class="${cls}" style="${[style, ...colours].filter(Boolean).join(";")}"`;
  };

  const darkCss = () =>
    [...used].map((r) => `.${r}{${declaration(r, dark)} !important}`).join("");

  return { paint, darkCss };
}

function stack(name: "display" | "sans" | "type"): string {
  return lightTokens[name]
    .split(",")
    .map((f) => f.trim())
    .filter((f) => !f.startsWith("var("))
    .join(",")
    .replace(/"/g, "'");
}

export const FACE = { display: stack("display"), sans: stack("sans"), mono: stack("type") };

export function fontFaces(base: string): string {
  const face = (family: string, file: string, weight: string) =>
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(${new URL(`/fonts/${file}`, base)}) format('woff2');}`;
  return [
    face("Red Hat Display", "red-hat-display-latin.woff2", "800"),
    face("Red Hat Text", "red-hat-text-latin.woff2", "300 700"),
    face("Red Hat Mono", "red-hat-mono-latin.woff2", "300 700"),
  ].join("");
}
