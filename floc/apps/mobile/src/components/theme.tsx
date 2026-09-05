/**
 * Which palette is on (tickets 288, 289).
 *
 * The web app keeps the choice in `localStorage` and writes `data-theme` before
 * paint; the phone has neither, so it follows the OS and nothing else. That is
 * a real difference in mechanism, not in behaviour — both end up with one of
 * the two palettes in `@floc/core/tokens`, and no component knows which.
 *
 * A per-app override is deliberately not here. Adding one means a second place
 * a person sets their theme and a second thing to keep in step; if it is ever
 * wanted, it belongs in the account, not in device storage.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { palette, type Palette, type Theme } from "@/lib/theme";

type ThemeValue = { theme: Theme; c: Palette };

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const theme: Theme = scheme === "dark" ? "dark" : "light";
  const value = useMemo(() => ({ theme, c: palette(theme) }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** `c` is short because it is read on nearly every style line — `c.sheet`, `c.ink`. */
export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme outside ThemeProvider");
  return value;
}
