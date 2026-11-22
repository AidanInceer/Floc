import { countWord } from "../text/count-word";
import type { PaintMode } from "./finding/day-paint";

export const MARK_WORDS: Record<PaintMode, string> = { free: "Can do", prefer: "Prefer" };
export const SOME_FREE_WORDS = "Some free";
export const EVERYONE_FREE_WORDS = "Everyone free";
export const NO_DAYS_MARKED = "No days marked yet";
export const DATES_NOT_SAVED = "That did not save. Try again.";

export function daysLabel(days: number): string {
  return days === 0 ? "No days" : countWord(days, "day");
}
