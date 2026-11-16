import { addDays, type IsoDate } from "../dates/dates";

export const CONSENT_COOKIE = "floc_consent";
export const CONSENT_DAYS = 365;
export const CONSENT_MAX_AGE_SECONDS = CONSENT_DAYS * 24 * 60 * 60;

export type ConsentChoice = { functional: boolean; analytics: boolean };

export const NO_CONSENT: ConsentChoice = { functional: false, analytics: false };
export const FULL_CONSENT: ConsentChoice = { functional: true, analytics: true };

export const CONSENT_CATEGORIES = [
  { key: "necessary", label: "Strictly necessary", detail: "Required for the service to operate, including sign-in, account security and the record of your cookie preferences. These cannot be switched off." },
  { key: "functional", label: "Preferences", detail: "Store display settings you select on this device, such as the sort order of Ideas and the sections you collapse in Notes." },
  { key: "analytics", label: "Analytics", detail: "Allow us to count which pages are visited, so that we can improve the service. No cookie is set and no information that identifies you is recorded." },
] as const;

export function consentSummary(choice: ConsentChoice | null): string {
  if (!choice) return "Not chosen yet";
  if (choice.functional && choice.analytics) return "Preferences and analytics on";
  if (choice.analytics) return "Analytics on";
  if (choice.functional) return "Preferences on";
  return "Optional cookies off";
}

const FORMAT = /^1\.f([01])\.a([01])\.(\d{4}-\d{2}-\d{2})$/;

export function encodeConsent(choice: ConsentChoice, day: IsoDate): string {
  return `1.f${choice.functional ? 1 : 0}.a${choice.analytics ? 1 : 0}.${day}`;
}

export function readConsent(raw: string | null | undefined, today: IsoDate): ConsentChoice | null {
  const match = raw ? FORMAT.exec(raw) : null;
  if (!match) return null;
  const day = match[3];
  if (day > today || addDays(day, CONSENT_DAYS) <= today) return null;
  return { functional: match[1] === "1", analytics: match[2] === "1" };
}
