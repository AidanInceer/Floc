/**
 * Why: React Native has no cascade and no `var()`, so a token must be resolved to a value here
 * rather than declared. Values come from `@floc/core/tokens`, the same file `pnpm fitness` checks
 * the web stylesheet against, so the two UIs cannot disagree. Built once at module load — ~65
 * tokens per theme, and the map never changes (#288, #289).
 */
import { resolveTokens, type Theme } from "@floc/core/design/tokens";

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
 * Why: bundled through `@expo-google-fonts`, not named — naming a face lets the platform fall
 * back, and every word rendered in Roboto. One family per weight, never `fontWeight`: React
 * Native cannot synthesise a bold, and Android quietly renders the regular instead (#189).
 */
export const fonts = {
  display: "BricolageGrotesque_600SemiBold",
  displayBold: "BricolageGrotesque_700Bold",
  sans: "InstrumentSans_400Regular",
  sansBold: "InstrumentSans_600SemiBold",
  type: "DMMono_400Regular",
  typeBold: "DMMono_500Medium",
} as const;

// Why: Tailwind's rhythm restated where Tailwind cannot reach, so a screen never invents a gap.
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Why: the web ramp to the pixel — the app's own tighter one read as blocky beside a browser.
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

// Why: matches the web ramp; `type` is tabular and carries every figure.
export const size = {
  label: 11,
  small: 13,
  body: 15,
  heading: 20,
  display: 28,
} as const;
