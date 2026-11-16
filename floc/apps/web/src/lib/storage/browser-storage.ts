import { browserConsent } from "@/lib/consent/consent-cookie";

import type { FunctionalKey } from "./functional-keys";

export function readStored(key: FunctionalKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: FunctionalKey, value: string): void {
  if (!browserConsent()?.functional) return;
  try {
    localStorage.setItem(key, value);
  } catch {
  }
}
