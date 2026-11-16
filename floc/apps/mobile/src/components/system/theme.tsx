import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

import { palette, type Palette, type Theme } from "@/lib/theme";

export type ThemeChoice = Theme | "system";

const KEY = "floc.theme";

type ThemeValue = {
  theme: Theme;
  c: Palette;
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

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme outside ThemeProvider");
  return value;
}
