"use client";

import { useSyncExternalStore } from "react";

import type { ConsentChoice } from "@floc/core/consent/consent";

import { browserConsent, onConsentChange } from "@/lib/consent/consent-cookie";

export function useConsent(fromServer: ConsentChoice | null): ConsentChoice | null {
  return useSyncExternalStore(onConsentChange, browserConsent, () => fromServer);
}
