"use client";

import { useSyncExternalStore } from "react";

import type { ConsentChoice } from "@floc/core/consent/consent";

import { browserConsent, onConsentChange } from "@/lib/consent/consent-cookie";

/** The choice as the server read it for the first paint, then as this browser holds it. Null means not asked. */
export function useConsent(fromServer: ConsentChoice | null): ConsentChoice | null {
  return useSyncExternalStore(onConsentChange, browserConsent, () => fromServer);
}
