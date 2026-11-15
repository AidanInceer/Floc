import { browserConsent } from "@/lib/consent/consent-cookie";

import type { FunctionalKey } from "./functional-keys";

/** Why: a browser can refuse storage outright (private mode, blocked cookies); a preference must never throw (#572). */
export function readStored(key: FunctionalKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Why the check (#368): this is storage nobody asked for, so it waits for a yes to "Remember my choices". */
export function writeStored(key: FunctionalKey, value: string): void {
  if (!browserConsent()?.functional) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // The choice still holds for this page; it will not survive a reload.
  }
}
