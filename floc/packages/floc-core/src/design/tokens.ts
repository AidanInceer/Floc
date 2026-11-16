export type TokenValue = string;

export type Theme = "light" | "dark";

export const lightTokens = {
  paper: "#fafafa",
  sheet: "#ffffff",
  "sheet-2": "#f5f4f0",
  "sheet-3": "#eeece7",
  rule: "#e6e4de",
  "rule-2": "#d8d5cd",

  ink: "#14141a",
  "ink-2": "#63636f",
  "ink-3": "#6f6f7b",
  "phone-frame": "var(--ink)",

  pen: "#4e68d8",
  "pen-deep": "#2b3b85",
  "pen-2": "#e7ebfa",

  "pastel-blue": "#dfe3ff",
  "pastel-blue-ink": "#33409b",
  "pastel-green": "#dcefe4",
  "pastel-green-ink": "#1b6b4c",
  "pastel-yellow": "#fbeac8",
  "pastel-yellow-ink": "#8a6412",
  "pastel-red": "#faddd6",
  "pastel-red-ink": "#a34a31",

  "pastel-blue-edge": "#c6d0f2",
  "pastel-green-edge": "#c3e3d2",
  "pastel-yellow-edge": "#efd9ae",
  "pastel-red-edge": "#f0c7bc",

  highlight: "var(--pastel-yellow)",
  "highlight-2": "#fdf4e1",
  "highlight-ink": "var(--pastel-yellow-ink)",
  "highlight-edge": "var(--pastel-yellow-edge)",
  red: "var(--pastel-red-ink)",
  "red-2": "var(--pastel-red)",
  "red-edge": "var(--pastel-red-edge)",
  green: "var(--pastel-green-ink)",
  "green-2": "var(--pastel-green)",
  "green-edge": "var(--pastel-green-edge)",
  "pen-edge": "var(--pastel-blue-edge)",

  "tone-yellow": "var(--pastel-yellow)",
  "tone-yellow-ink": "var(--ink)",
  "tone-red": "var(--pastel-red)",
  "tone-red-ink": "var(--ink)",
  "tone-green": "var(--pastel-green)",
  "tone-green-ink": "var(--ink)",
  "tone-blue": "var(--pastel-blue)",
  "tone-blue-ink": "var(--ink)",

  "some-free-1": "#fcebe6",
  "some-free-2": "var(--pastel-red)",
  "some-free-3": "var(--pastel-red-edge)",
  "some-free-ink": "#8c3b26",

  "red-solid": "var(--some-free-ink)",
  "red-solid-ink": "#ffffff",

  ease: "cubic-bezier(0.2, 0.85, 0.3, 1)",
  "ease-even": "cubic-bezier(0.45, 0, 0.25, 1)",
  "shadow-sm": "0 1px 2px rgb(20 20 26 / 0.05)",
  shadow:
    "0 1px 2px rgb(20 20 26 / 0.05), 0 6px 14px -12px rgb(20 20 26 / 0.3)",
  "shadow-lift":
    "0 2px 4px rgb(20 20 26 / 0.06), 0 14px 28px -16px rgb(20 20 26 / 0.35)",

  pro: "var(--sheet-2)",
  "pro-2": "var(--sheet)",
  "pro-edge": "var(--rule-2)",
  "pro-ink": "var(--ink)",
  "pro-ink-2": "var(--ink-2)",
  "pro-mark": "var(--ink)",
  slab: "var(--ink)",
  "slab-ink": "var(--paper)",

  vignette: "rgb(255 255 255 / 0.5)",

  display:
    'var(--font-display-face), "Red Hat Display", "Trebuchet MS", system-ui, sans-serif',
  sans: 'var(--font-body-face), "Red Hat Text", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  type: 'var(--font-data-face), "Red Hat Mono", "Cascadia Mono", Consolas, "Courier New", monospace',

  "who-1": "var(--pastel-blue)",
  "who-1-ink": "var(--pastel-blue-ink)",
  "who-2": "var(--pastel-red)",
  "who-2-ink": "var(--pastel-red-ink)",
  "who-3": "var(--pastel-yellow)",
  "who-3-ink": "var(--pastel-yellow-ink)",
  "who-4": "var(--pastel-green)",
  "who-4-ink": "var(--pastel-green-ink)",
  "who-5": "var(--pen-2)",
  "who-5-ink": "var(--pen-deep)",
  "who-6": "#e4ecec",
  "who-6-ink": "#3d5c5a",
  "who-7": "#f3e7da",
  "who-7-ink": "#7a5a2b",
  "who-8": "#e9e7e2",
  "who-8-ink": "#5a564d",
} as const satisfies Record<string, TokenValue>;

export type TokenName = keyof typeof lightTokens;

export const darkTokens: Readonly<Partial<Record<TokenName, TokenValue>>> = {
  paper: "#18181b",
  sheet: "#222226",
  "sheet-2": "#2a2a2f",
  "sheet-3": "#323238",
  rule: "#34343a",
  "rule-2": "#45454c",

  ink: "#f0f0f3",
  "ink-2": "#b8b8c1",
  "ink-3": "#a2a2ac",
  "phone-frame": "var(--rule-2)",

  pen: "#9aabff",
  "pen-deep": "#c3cbff",
  "pen-2": "#24283a",

  "pastel-blue": "#252a3d",
  "pastel-blue-ink": "#c3cbff",
  "pastel-green": "#1f2e27",
  "pastel-green-ink": "#9fe0c0",
  "pastel-yellow": "#2f2a1e",
  "pastel-yellow-ink": "#f2d596",
  "pastel-red": "#302326",
  "pastel-red-ink": "#f5b7a5",

  "pastel-blue-edge": "#39406a",
  "pastel-green-edge": "#2f4a3d",
  "pastel-yellow-edge": "#4a4230",
  "pastel-red-edge": "#4c3438",

  "tone-yellow": "var(--pastel-yellow-edge)",
  "tone-yellow-ink": "var(--pastel-yellow-ink)",
  "tone-red": "var(--pastel-red-edge)",
  "tone-red-ink": "var(--pastel-red-ink)",
  "tone-green": "var(--pastel-green-edge)",
  "tone-green-ink": "var(--pastel-green-ink)",
  "tone-blue": "var(--pastel-blue-edge)",
  "tone-blue-ink": "var(--pastel-blue-ink)",

  "some-free-1": "var(--pastel-red)",
  "some-free-2": "#3e2b2f",
  "some-free-ink": "var(--pastel-red-ink)",

  "highlight-2": "#262219",

  "who-6": "#212b2b",
  "who-6-ink": "#a6d0cc",
  "who-7": "#2d271f",
  "who-7-ink": "#e0c59f",
  "who-8": "#29292c",
  "who-8-ink": "#c8c5bd",

  "shadow-sm": "0 1px 2px rgb(0 0 0 / 0.4)",
  shadow: "0 1px 2px rgb(0 0 0 / 0.4), 0 6px 14px -12px rgb(0 0 0 / 0.9)",
  "shadow-lift":
    "0 2px 4px rgb(0 0 0 / 0.5), 0 14px 28px -16px rgb(0 0 0 / 0.95)",


  vignette: "rgb(255 255 255 / 0.05)",
  "red-solid": "#8f3a26",
  slab: "#0b0b0d",
  "slab-ink": "var(--ink)",
};

export const radii = { sm: 8, md: 12, pill: 999 } as const;

export const fontStacks = {
  display: ["Red Hat Display", "Trebuchet MS", "System"],
  sans: ["Red Hat Text", "System"],
  type: ["Red Hat Mono", "Courier New", "System"],
} as const;

const ALIAS = /^var\(--([\w-]+)\)$/;

export function resolveTokens(theme: Theme = "light"): Record<TokenName, string> {
  const raw: Record<string, TokenValue> = { ...lightTokens };
  if (theme === "dark") Object.assign(raw, darkTokens);

  const follow = (name: string, seen: Set<string>): string | undefined => {
    const value = raw[name];
    if (value === undefined || seen.has(name)) return undefined;
    const alias = ALIAS.exec(value);
    if (!alias) return value;
    seen.add(name);
    return follow(alias[1], seen);
  };

  const out: Record<string, string> = {};
  for (const name of Object.keys(raw)) {
    const value = follow(name, new Set());
    if (value !== undefined) out[name] = value;
  }
  return out;
}

export function resolveColours(theme: Theme = "light"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(resolveTokens(theme))) {
    if (/^#[0-9a-f]{6}$/i.test(value)) out[name] = value.toLowerCase();
  }
  return out;
}
