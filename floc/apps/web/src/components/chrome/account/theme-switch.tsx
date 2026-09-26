"use client";

/**
 * The light / dark / auto switch (ticket 240): a three-segment pill on the same
 * recessed track as `PillNav`. Icons only since the account ticket — each still
 * names itself to a screen reader and on hover.
 *
 * The selected segment is painted by CSS keyed off `:root[data-theme-choice]`,
 * not by React state — the attribute is on `<html>` before first paint, so the
 * right segment is lit in the same frame the page arrives, with nothing to
 * hydrate. State exists only to carry `aria-pressed`, which CSS cannot say.
 */
import { useEffect, useState, type ReactElement } from "react";

import { cx } from "@/components/system/ui";
import {
  DeviceIcon,
  MoonIcon,
  SunIcon,
} from "@/components/chrome/account/account-icons";
import {
  THEME_CHOICES,
  readStoredChoice,
  resolveTheme,
  storeChoice,
  type ThemeChoice,
} from "@/lib/theme";

const LABELS: Record<ThemeChoice, string> = {
  light: "Light",
  dark: "Dark",
  system: "Auto",
};

const ICONS: Record<ThemeChoice, () => ReactElement> = {
  light: SunIcon,
  dark: MoonIcon,
  system: DeviceIcon,
};

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
      document.documentElement.dataset.theme = resolveTheme(
        "system",
        query.matches,
      );
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
      {THEME_CHOICES.map((option) => {
        const Icon = ICONS[option];
        return (
          <button
            key={option}
            type="button"
            data-choice={option}
            aria-pressed={choice === null ? undefined : choice === option}
            onClick={() => choose(option)}
            // Colour is left to `.theme-choice` in globals.css — a Tailwind text
            // utility here sits in a later layer and wins over the lit state.
            aria-label={LABELS[option]}
            title={LABELS[option]}
            className="theme-choice relative z-10 flex h-7 w-8 items-center justify-center rounded-full"
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
