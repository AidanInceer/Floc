/**
 * The palette, drawn natively (tickets 288, 289).
 *
 * React Native has no cascade and no `var()`, so a token cannot be *declared*
 * here the way `globals.css` declares one — it has to be resolved to a value
 * first. `resolveTokens` does exactly that, following the aliases the web app
 * leaves to the browser.
 *
 * The values come from `@floc/core/tokens`, which is the same file the web
 * app's stylesheet is checked against on every `pnpm fitness`. That is the
 * whole reason the two UIs can look like one product while sharing no
 * components: they cannot disagree about what "peri" is.
 *
 * The two themes are built once at module load — there are ~65 tokens and
 * rebuilding them on every render of every screen would be a real cost for a
 * map that never changes.
 */
import { fontStacks, resolveTokens, type Theme } from "@floc/core/tokens";
import { Platform } from "react-native";

export type { Theme };

export type Palette = Record<string, string>;

const PALETTES: Record<Theme, Palette> = {
  light: resolveTokens("light"),
  dark: resolveTokens("dark"),
};

export function palette(theme: Theme): Palette {
  return PALETTES[theme];
}

/**
 * The three faces (#189). Until the font files are bundled, this names the
 * face and lets the platform fall back — a missing family renders in the
 * system face rather than failing, which is rule 11 applied to type.
 */
export const fonts = {
  display: Platform.select({
    ios: fontStacks.display[0],
    default: fontStacks.display[0],
  }),
  sans: Platform.select({ ios: fontStacks.sans[0], default: fontStacks.sans[0] }),
  type: Platform.select({ ios: fontStacks.type[0], default: fontStacks.type[0] }),
} as const;

/**
 * The one spacing scale, so a screen never invents a gap. Not a token in the
 * CSS sense — the web app spaces with Tailwind's scale, and this is the same
 * rhythm expressed where Tailwind cannot reach.
 */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const;

/** Type sizes, matching the web app's ramp. `type` is tabular and carries every figure. */
export const size = {
  label: 11,
  small: 13,
  body: 15,
  heading: 20,
  display: 28,
} as const;
