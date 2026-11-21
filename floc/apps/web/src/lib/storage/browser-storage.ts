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

const heldForTab = new Map<string, string>();

export function readForTab(key: string): string | null {
  try {
    return sessionStorage.getItem(key) ?? heldForTab.get(key) ?? null;
  } catch {
    return heldForTab.get(key) ?? null;
  }
}

export function writeForTab(key: string, value: string): void {
  heldForTab.set(key, value);
  try {
    sessionStorage.setItem(key, value);
  } catch {
  }
}
