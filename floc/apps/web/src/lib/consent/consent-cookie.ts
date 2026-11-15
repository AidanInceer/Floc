/**
 * The consent choice in the browser (#368): one first-party cookie, so the server can read it too and render no
 * banner and count no page view without a yes. No `server-only` and no `use client`: both sides import it.
 */
import { CONSENT_COOKIE, CONSENT_MAX_AGE_SECONDS, encodeConsent, readConsent, type ConsentChoice } from "@floc/core/consent/consent";
import { today, type IsoDate } from "@floc/core/dates/dates";

import { FUNCTIONAL_KEYS, FUNCTIONAL_PREFIXES } from "@/lib/storage/functional-keys";

export function consentCookie(choice: ConsentChoice, day: IsoDate, secure: boolean): string {
  return `${CONSENT_COOKIE}=${encodeConsent(choice, day)}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function cookieValue(header: string | null | undefined, name: string): string | null {
  for (const part of (header ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

let held: ConsentChoice | null | undefined;
const listeners = new Set<() => void>();

/** Null means not asked yet, or asked more than a year ago. */
export function browserConsent(): ConsentChoice | null {
  if (held === undefined) held = typeof document === "undefined" ? null : readConsent(cookieValue(document.cookie, CONSENT_COOKIE), today());
  return held;
}

export function chooseConsent(choice: ConsentChoice): void {
  document.cookie = consentCookie(choice, today(), location.protocol === "https:");
  held = choice;
  if (!choice.functional) {
    try {
      const kept = Object.keys(localStorage).filter((key) => FUNCTIONAL_PREFIXES.some((prefix) => key.startsWith(prefix)));
      for (const key of [...FUNCTIONAL_KEYS, ...kept]) localStorage.removeItem(key);
    } catch {
      // A browser that refuses storage holds nothing to remove.
    }
  }
  for (const listener of listeners) listener();
}

export function onConsentChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** For tests: the next read looks at the browser again. */
export function forgetBrowserConsent(): void {
  held = undefined;
}
