"use client";

/**
 * The light / dark / auto switch (ticket 240): a three-segment pill with words,
 * on the same recessed track as `PillNav`.
 *
 * The selected segment is painted by CSS keyed off `:root[data-theme-choice]`,
 * not by React state — the attribute is on `<html>` before first paint, so the
 * right segment is lit in the same frame the page arrives, with nothing to
 * hydrate. State exists only to carry `aria-pressed`, which CSS cannot say.
 */
import { useEffect, useState } from "react";

import { cx } from "@/components/system/ui";
import {
  THEME_CHOICES,
  readStoredChoice,
  resolveTheme,
  storeChoice,
  type ThemeChoice,
} from "@/lib/theme";

const LABELS: Record<ThemeChoice, string> = { light: "Light", dark: "Dark", system: "Auto" };

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function ThemeSwitch({ className }: { className?: string }) {
  const [choice, setChoice] = useState<ThemeChoice | null>(null);

  useEffect(() => {
    setChoice(readStoredChoice(document.documentElement.dataset.themeChoice));
  }, []);

  // Auto has to keep following the device while the page stays open.
  useEffect(() => {
    if (choice !== "system") return;
    const query = matchMedia(DARK_QUERY);
    const follow = () => {
      document.documentElement.dataset.theme = resolveTheme("system", query.matches);
    };
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, [choice]);

  const choose = (next: ThemeChoice) => {
    const root = document.documentElement;
    root.dataset.themeChoice = next;
    root.dataset.theme = resolveTheme(next, matchMedia(DARK_QUERY).matches);
    storeChoice(next);
    setChoice(next);
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cx(
        "relative grid shrink-0 grid-cols-3 items-center rounded-full bg-sheet-3 p-[3px]",
        className,
      )}
    >
      {/* One sliding fill, exactly as PillNav does it, positioned by CSS keyed
          off `<html>` so it is under the right segment in the first painted frame. */}
      <span
        aria-hidden
        className="theme-indicator pointer-events-none absolute left-[3px] top-[3px] h-7 w-[calc((100%-6px)/3)] rounded-full bg-sheet shadow-card transition-transform duration-200 ease-[cubic-bezier(0.2,0.85,0.3,1)] motion-reduce:transition-none"
      />
      {THEME_CHOICES.map((option) => (
        <button
          key={option}
          type="button"
          data-choice={option}
          aria-pressed={choice === null ? undefined : choice === option}
          onClick={() => choose(option)}
          // Colour is left to `.theme-choice` in globals.css — a Tailwind text
          // utility here sits in a later layer and wins over the lit state.
          className="theme-choice relative z-10 flex h-7 items-center justify-center gap-1.5 rounded-full px-2.5 text-[12.5px]"
        >
          {option === "light" ? <SunIcon /> : option === "dark" ? <MoonIcon /> : null}
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 1.3v1.3M7 11.4v1.3M1.3 7h1.3M11.4 7h1.3M3 3l.9.9M10.1 10.1l.9.9M11 3l-.9.9M3.9 10.1 3 11" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    >
      <path d="M10.9 9.4A4.6 4.6 0 0 1 6 2a5 5 0 1 0 4.9 7.4Z" />
    </svg>
  );
}
