/** The rules for a guest on an invite link (#442, ADR-029). */
import { capText } from "../text/text";

/** Guests per trip; separate from the member cap, so a flood of guests cannot keep a member out. */
export const GUEST_CAP = 12;

/** New guests one IP address may start in an hour. */
export const GUEST_IP_LIMIT = 5;
export const GUEST_IP_WINDOW_MS = 60 * 60 * 1000;

/** Days a guest has to make an account before they are deleted with their answers. */
export const GUEST_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export function guestCutoff(now: Date): Date {
  return new Date(now.getTime() - GUEST_DAYS * DAY_MS);
}

/** The name a guest gives, held to the same cap as a display name. */
export function guestName(value: unknown): string | null {
  return capText(value, "displayName");
}
