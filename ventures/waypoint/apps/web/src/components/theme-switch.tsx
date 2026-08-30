"use client";

/**
 * The light/dark switch (ticket 240): a two-segment pill in the header, on the
 * same recessed track as `PillNav`, so the right-hand side of the bar reads as
 * one family of controls.
 *
 * The selected segment is painted by CSS keyed off `:root[data-theme]`, not by
 * React state — the attribute is on `<html>` before first paint, so the right
 * segment is lit in the same frame the page arrives, with no flash and nothing
 * to hydrate. State exists only to carry `aria-pressed`, which CSS cannot say.
 */
import { useEffect, useState } from "react";

import { THEMES, readStoredTheme, storeTheme, type Theme } from "@/lib/theme";

export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(readStoredTheme(document.documentElement.dataset.theme));
  }, []);

  const choose = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    storeTheme(next);
    setTheme(next);
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-sheet-3 p-0.5"
    >
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          data-choice={option}
          aria-label={option === "light" ? "Light" : "Dark"}
          aria-pressed={theme === null ? undefined : theme === option}
          onClick={() => choose(option)}
          // Colour is left to `.theme-choice` in globals.css — a Tailwind text
          // utility here sits in a later layer and wins over the lit state.
          className="theme-choice lift flex h-8 w-7 items-center justify-center rounded-full sm:w-8"
        >
          {option === "light" ? <SunriseIcon /> : <MoonIcon />}
        </button>
      ))}
    </div>
  );
}

// Half a sun over the horizon rather than a full disc with rays: at 14px the
// rays close up and the glyph reads as a blob.
function SunriseIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <circle cx="7" cy="8" r="2.3" />
      <path d="M7 2.9v1.2M3.1 8H1.9M12.1 8h-1.2M4.1 5.1l-.85-.85M9.9 5.1l.85-.85M1.4 11.4h11.2" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <path d="M11.4 8.6A4.9 4.9 0 0 1 5.4 2.6a4.9 4.9 0 1 0 6 6Z" />
    </svg>
  );
}
