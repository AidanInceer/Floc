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
import { resolveTokens, type Theme } from "@floc/core/tokens";

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
 * The three faces (#189), bundled rather than named (#no-ticket).
 *
 * THEY USED TO BE A WISH. This named "Bricolage Grotesque" and let the
 * platform fall back, which on a phone means every word in the app rendered in
 * Roboto — the wordmark included, so the app and the browser were visibly two
 * products. The same three faces the web self-hosts through `next/font` are
 * now bundled here through `@expo-google-fonts`, and `useFonts` in the root
 * layout loads them before anything draws.
 *
 * ONE FAMILY PER WEIGHT, AND NEVER `fontWeight`. React Native cannot
 * synthesise a bold from a single font file: ask it to and Android quietly
 * renders the regular, so the app would look *nearly* right in a way nobody
 * could point at. Every weight is therefore its own family and every call site
 * picks the family instead — `sans` and `sansBold`, not `sans` at 600.
 *
 * `display` is 600 because that is the weight it is used at everywhere but
 * `Heading`, which takes `displayBold`.
 */
export const fonts = {
  display: "BricolageGrotesque_600SemiBold",
  displayBold: "BricolageGrotesque_700Bold",
  sans: "InstrumentSans_400Regular",
  sansBold: "InstrumentSans_600SemiBold",
  type: "DMMono_400Regular",
  typeBold: "DMMono_500Medium",
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

/**
 * The web's radius ramp, to the pixel (`globals.css`: 10/16/22/pill). The app
 * had a tighter one, which read as blocky next to the same panel in a browser.
 */
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

/** Type sizes, matching the web app's ramp. `type` is tabular and carries every figure. */
export const size = {
  label: 11,
  small: 13,
  body: 15,
  heading: 20,
  display: 28,
} as const;
