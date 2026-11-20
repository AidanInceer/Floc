"use client";

import { useLayoutEffect } from "react";

import { keepTheme, THEME_STORAGE_KEY } from "@/lib/theme";

function storedChoice(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function ThemeKeeper({ signedIn }: { signedIn: boolean }) {
  useLayoutEffect(() => {
    keepTheme(document.documentElement, {
      signedIn,
      stored: storedChoice(),
      prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
    });
  }, [signedIn]);
  return null;
}
