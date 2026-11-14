"use client";

/**
 * The light / dark / auto switch (ticket 240): a three-segment pill on a
 * recessed `--sheet-3` track. Icons only since the account ticket — each still
 * names itself to a screen reader and on hover.
 *
 * The selected segment is painted by CSS keyed off `:root[data-theme-choice]`,
 * not by React state — the attribute is on `<html>` before first paint, so the
 * right segment is lit in the same frame the page arrives, with nothing to
 * hydrate. State exists only to carry `aria-pressed`, which CSS cannot say.
 */
import { useEffect, useState, type ReactElement } from "react";

import { cx } from "@/components/system/ui";
import { DeviceIcon, SunIcon } from "@/components/system/icons/account";
import { MoonIcon } from "@/components/system/icons";
import {
  THEME_CHOICES,
  applyTheme,
  readStoredChoice,
  storeChoice,
  type ThemeChoice,
} from "@/lib/theme";
import "./theme-switch.css";

const LABELS: Record<ThemeChoice, string> = {
  light: "Light",
  dark: "Dark",
  system: "Auto",
};

const ICONS: Record<ThemeChoice, (props: { size?: number }) => ReactElement> = {
  light: SunIcon,
  dark: MoonIcon,
  system: DeviceIcon,
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** `words` names each segment beside its icon, for a roomy spot such as the account card. */
export function ThemeSwitch({ className, words }: { className?: string; words?: boolean }) {
  const [choice, setChoice] = useState<ThemeChoice | null>(null);

  useEffect(() => {
    setChoice(readStoredChoice(document.documentElement.dataset.themeChoice));
  }, []);

  // Auto has to keep following the device while the page stays open.
  useEffect(() => {
    if (choice !== "system") return;
    const query = matchMedia(DARK_QUERY);
    const follow = () => {
      applyTheme(document.documentElement, "system", query.matches);
    };
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, [choice]);

  const choose = (next: ThemeChoice) => {
    applyTheme(document.documentElement, next, matchMedia(DARK_QUERY).matches);
    storeChoice(next);
    setChoice(next);
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cx(
        "relative grid shrink-0 grid-cols-3 items-center rounded-md bg-sheet-3 p-[3px]",
        className,
      )}
    >
      {/* One sliding fill, positioned by CSS keyed
          off `<html>` so it is under the right segment in the first painted frame. */}
      <span
        aria-hidden
        className="theme-indicator pointer-events-none absolute left-[3px] top-[3px] h-7 w-[calc((100%-6px)/3)] rounded-sm bg-sheet shadow-card transition-transform duration-200 ease-[cubic-bezier(0.2,0.85,0.3,1)] motion-reduce:transition-none"
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
            aria-label={words ? undefined : LABELS[option]}
            title={words ? undefined : LABELS[option]}
            className={cx("theme-choice relative z-10 flex h-7 items-center justify-center rounded-sm", words ? "gap-1.5 px-2.5 text-[13px]" : "w-8")}
          >
            <Icon />
            {words ? LABELS[option] : null}
          </button>
        );
      })}
    </div>
  );
}
