/**
 * Which palette is on (tickets 288, 289; the choice added by 302).
 *
 * THREE STATES, NOT TWO. "System" follows the OS, which is the default and
 * what most people want; light and dark are an explicit override. That is the
 * same shape as the web app's toggle, and the same rule about where it lives:
 * a device setting, never a column (#302). Two devices may sit on two themes
 * and neither is wrong.
 *
 * WHY THE KEYCHAIN FOR A THEME. `expo-secure-store` is already a dependency
 * because the session token must live there; a theme is not a secret, but a
 * second storage library for one short string is a worse trade than putting it
 * somewhere slightly too safe.
 *
 * WHY IT FLASHES. The web writes `data-theme` before paint; a phone cannot
 * read storage synchronously, so the first frame is the OS theme and the saved
 * choice lands immediately after. Rendering nothing until it loads would trade
 * a flash for a blank screen, which is worse.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

import { palette, type Palette, type Theme } from "@/lib/theme";

export type ThemeChoice = Theme | "system";

const KEY = "floc.theme";

type ThemeValue = {
  theme: Theme;
  c: Palette;
  /** What the person picked, which is not the same as what is drawn. */
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

function readChoice(value: string | null): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [choice, setStoredChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    // A store that will not open costs the saved choice, never the app (rule 11).
    SecureStore.getItemAsync(KEY)
      .then((value) => setStoredChoice(readChoice(value)))
      .catch(() => setStoredChoice("system"));
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const followed: Theme = scheme === "dark" ? "dark" : "light";
    const theme = choice === "system" ? followed : choice;
    return {
      theme,
      c: palette(theme),
      choice,
      setChoice: (next) => {
        setStoredChoice(next);
        void SecureStore.setItemAsync(KEY, next).catch(() => {});
      },
    };
  }, [choice, scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** `c` is short because it is read on nearly every style line — `c.sheet`, `c.ink`. */
export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme outside ThemeProvider");
  return value;
}
