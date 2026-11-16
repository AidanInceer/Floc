import { radii, resolveTokens, type Theme, type TokenName } from "@floc/core/design/tokens";

export type { Theme };

export type Palette = Record<TokenName, string>;

const PALETTES: Record<Theme, Palette> = {
  light: resolveTokens("light"),
  dark: resolveTokens("dark"),
};

export function palette(theme: Theme): Palette {
  return PALETTES[theme];
}

export const fonts = {
  display: "RedHatDisplay_800ExtraBold",
  displayBold: "RedHatDisplay_800ExtraBold",
  sans: "RedHatText_400Regular",
  sansItalic: "RedHatText_400Regular_Italic",
  sansBold: "RedHatText_600SemiBold",
  type: "RedHatMono_400Regular",
  typeBold: "RedHatMono_500Medium",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = radii;

export const size = {
  label: 11,
  small: 13,
  body: 15,
  heading: 20,
  display: 28,
} as const;
