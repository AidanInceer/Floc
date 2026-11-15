import type { ConsentChoice } from "@floc/core/consent/consent";
import { useSyncExternalStore } from "react";

import { currentConsent, onConsentChange } from "@/lib/consent/consent";

export function useConsentChoice(): ConsentChoice {
  return useSyncExternalStore(onConsentChange, currentConsent);
}
