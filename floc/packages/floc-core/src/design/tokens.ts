/**
 * The token VALUES, in one place (ticket 288).
 *
 * Tokens are values. Each platform draws them itself: the web app declares them
 * as CSS custom properties in `app/globals.css`, and the phone apps read them
 * from here directly, because React Native has no cascade to declare them into.
 *
 * That leaves two copies of the same numbers, which is exactly the drift this
 * ticket exists to stop — so `scripts/check-tokens.mjs` asserts, on every
 * `pnpm fitness`, that globals.css declares this map and nothing else, in both
 * themes. The CSS stays the artefact the browser loads (no build step, no
 * generated file in the repo); this stays the source the check believes.
 *
 * Order matters and is asserted: a declaration that moves is a real diff.
 *
 * DARK IS AN OVERLAY. It restates only the values that change, exactly as the
 * cascade sees it — which is why an alias (`--red: var(--blush-ink)`) needs no
 * dark counterpart. `resolveTokens` flattens the two for a caller with no
 * cascade of its own.
 */

/** A token value as it is written: a hex, a `var()` alias, or a composite (shadow, easing, font stack). */
export type TokenValue = string;

export type Theme = "light" | "dark";

/** The light palette — the base every theme is an overlay on. */
export const lightTokens: Readonly<Record<string, TokenValue>> = {
  /* Ground and surfaces. Canvas is the page; white is every surface. */
  paper: "#fafafa",
  sheet: "#ffffff",
  "sheet-2": "#f5f4f0",
  "sheet-3": "#eeece7",
  rule: "#e6e4de",
  "rule-2": "#d8d5cd",

  /* Ink. Three steps, all clearing WCAG AA on every surface they paint on. */
  ink: "#14141a",
  "ink-2": "#63636f",
  "ink-3": "#6f6f7b",

  /* Blue means "yours to do" and nothing else. */
  pen: "#4e68d8",
  "pen-deep": "#2b3b85",
  "pen-2": "#e7ebfa",

  /* Four pastels, one per domain. The only place these values appear. */
  peri: "#dfe3ff",
  "peri-ink": "#33409b",
  mint: "#dcefe4",
  "mint-ink": "#1b6b4c",
  butter: "#fbeac8",
  "butter-ink": "#8a6412",
  blush: "#faddd6",
  "blush-ink": "#a34a31",

  "peri-edge": "#c6d0f2",
  "mint-edge": "#c3e3d2",
  "butter-edge": "#efd9ae",
  "blush-edge": "#f0c7bc",

  /* Status — a separate NAME, never a separate hex. */
  highlight: "var(--butter)",
  "highlight-2": "#fdf4e1",
  "highlight-ink": "var(--butter-ink)",
  "highlight-edge": "var(--butter-edge)",
  red: "var(--blush-ink)",
  "red-2": "var(--blush)",
  "red-edge": "var(--blush-edge)",
  green: "var(--mint-ink)",
  "green-2": "var(--mint)",
  "green-edge": "var(--mint-edge)",
  "pen-edge": "var(--peri-edge)",

  /* A member's highlight and table colour on a notes page (#408): the tint, and the text on it. */
  "tone-butter": "var(--butter)",
  "tone-butter-ink": "var(--ink)",
  "tone-blush": "var(--blush)",
  "tone-blush-ink": "var(--ink)",
  "tone-mint": "var(--mint)",
  "tone-mint-ink": "var(--ink)",
  "tone-peri": "var(--peri)",
  "tone-peri-ink": "var(--ink)",

  ease: "cubic-bezier(0.2, 0.85, 0.3, 1)",
  "shadow-sm": "0 1px 2px rgb(20 20 26 / 0.05)",
  shadow:
    "0 1px 2px rgb(20 20 26 / 0.05), 0 6px 14px -12px rgb(20 20 26 / 0.3)",
  "shadow-lift":
    "0 2px 4px rgb(20 20 26 / 0.06), 0 14px 28px -16px rgb(20 20 26 / 0.35)",

  /* Pro — the one block that leaves the blue-and-pastel language. */
  pro: "#fbf3e2",
  "pro-2": "#fffcf5",
  "pro-edge": "#ecdcb5",
  "pro-ink": "#3a2d0f",
  "pro-ink-2": "#6b5726",
  "pro-gold": "#8a6412",

  vignette: "rgb(255 255 255 / 0.5)",

  /* The three faces. `--font-*-face` is next/font's doing and web-only; the
     phone apps read `fontStacks` below instead. */
  display:
    'var(--font-display-face), "Bricolage Grotesque", "Trebuchet MS", system-ui, sans-serif',
  sans: 'var(--font-body-face), "Instrument Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  type: 'var(--font-data-face), "DM Mono", "Cascadia Mono", Consolas, "Courier New", monospace',

  /* Eight seats, assigned from the display name (`whoTone`), never a column. */
  "who-1": "var(--peri)",
  "who-1-ink": "var(--peri-ink)",
  "who-2": "var(--blush)",
  "who-2-ink": "var(--blush-ink)",
  "who-3": "var(--butter)",
  "who-3-ink": "var(--butter-ink)",
  "who-4": "var(--mint)",
  "who-4-ink": "var(--mint-ink)",
  "who-5": "var(--pen-2)",
  "who-5-ink": "var(--pen-deep)",
  "who-6": "#e4ecec",
  "who-6-ink": "#3d5c5a",
  "who-7": "#f3e7da",
  "who-7-ink": "#7a5a2b",
  "who-8": "#e9e7e2",
  "who-8-ink": "#5a564d",
};

/** Dark, as an overlay on light. Same names, new values — never a new name. */
export const darkTokens: Readonly<Record<string, TokenValue>> = {
  /* Neutral grey, not blue-grey: a tinted ground fought every pastel on it. */
  paper: "#18181b",
  sheet: "#222226",
  "sheet-2": "#2a2a2f",
  "sheet-3": "#323238",
  rule: "#34343a",
  "rule-2": "#45454c",

  /* Never pure white: #ffffff on a near-black ground haloes. */
  ink: "#f0f0f3",
  "ink-2": "#b8b8c1",
  "ink-3": "#a2a2ac",

  /* On a dark ground "pressed harder" reads as brighter, not darker. */
  pen: "#9aabff",
  "pen-deep": "#c3cbff",
  "pen-2": "#24283a",

  /* The pastels swap roles: the wash is only a hint, the ink carries the colour. */
  peri: "#252a3d",
  "peri-ink": "#c3cbff",
  mint: "#1f2e27",
  "mint-ink": "#9fe0c0",
  butter: "#2f2a1e",
  "butter-ink": "#f2d596",
  blush: "#302326",
  "blush-ink": "#f5b7a5",

  "peri-edge": "#39406a",
  "mint-edge": "#2f4a3d",
  "butter-edge": "#4a4230",
  "blush-edge": "#4c3438",

  /* A dark wash is too faint to mark words: highlights take the edge, and the ink carries the colour. */
  "tone-butter": "var(--butter-edge)",
  "tone-butter-ink": "var(--butter-ink)",
  "tone-blush": "var(--blush-edge)",
  "tone-blush-ink": "var(--blush-ink)",
  "tone-mint": "var(--mint-edge)",
  "tone-mint-ink": "var(--mint-ink)",
  "tone-peri": "var(--peri-edge)",
  "tone-peri-ink": "var(--peri-ink)",

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

  pro: "#17171d",
  "pro-2": "#23232c",
  "pro-edge": "#3b3b46",
  "pro-ink": "#f6f2e8",
  "pro-ink-2": "#b6b0a2",
  "pro-gold": "#e7bd63",

  vignette: "rgb(255 255 255 / 0.05)",
};

/**
 * The face names alone, for a platform that loads fonts by name rather than by
 * a CSS stack. The web keeps its `var(--font-*-face)` stacks above, because
 * next/font's generated family has to come first there.
 */
export const fontStacks = {
  display: ["Bricolage Grotesque", "Trebuchet MS", "System"],
  sans: ["Instrument Sans", "System"],
  type: ["DM Mono", "Courier New", "System"],
} as const;

const ALIAS = /^var\(--([\w-]+)\)$/;

/**
 * One flat map of resolved values for a caller with no cascade — React Native.
 * `var()` aliases are followed to what they point at; a cycle or a dangling
 * alias resolves to `undefined` and is dropped rather than throwing, so one bad
 * token can never take a screen down with it.
 */
export function resolveTokens(theme: Theme = "light"): Record<string, string> {
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

/** Just the tokens that are a plain 6-digit hex — the ones a native style can use directly. */
export function resolveColours(theme: Theme = "light"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(resolveTokens(theme))) {
    if (/^#[0-9a-f]{6}$/i.test(value)) out[name] = value.toLowerCase();
  }
  return out;
}
