"use client";

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

export function ThemeSwitch({ className, words }: { className?: string; words?: boolean }) {
  const [choice, setChoice] = useState<ThemeChoice | null>(null);

  useEffect(() => {
    setChoice(readStoredChoice(document.documentElement.dataset.themeChoice));
  }, []);

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
