import { capText } from "../text/text";

export const GUEST_CAP = 12;

export const GUEST_IP_LIMIT = 5;
export const GUEST_IP_WINDOW_MS = 60 * 60 * 1000;

export const GUEST_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export function guestCutoff(now: Date): Date {
  return new Date(now.getTime() - GUEST_DAYS * DAY_MS);
}

export function guestName(value: unknown): string | null {
  return capText(value, "displayName");
}

export function guestAsk({ dated, ideas }: { dated: boolean; ideas: number }): string {
  const days = dated ? "say if you can make the dates" : "mark the days you can make";
  const ask = ideas > 0 ? `vote on the ideas and ${days}` : days;
  return `${ask.charAt(0).toUpperCase()}${ask.slice(1)}.`;
}
