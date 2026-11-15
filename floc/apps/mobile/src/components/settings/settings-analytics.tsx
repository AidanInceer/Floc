/** The phone's one optional choice (#368). Off until the person turns it on; the web's Cookies page says the same. */
import { CONSENT_CATEGORIES } from "@floc/core/consent/consent";
import { useSyncExternalStore } from "react";

import { Toggle } from "@/components/system/ui";
import { currentConsent, onConsentChange, saveConsent } from "@/lib/consent/consent";

const ANALYTICS = CONSENT_CATEGORIES.find((category) => category.key === "analytics")!;

export function useAnalyticsConsent(): boolean {
  return useSyncExternalStore(onConsentChange, () => currentConsent().analytics);
}

export function SettingsAnalytics() {
  const on = useAnalyticsConsent();
  return (
    <Toggle
      label={ANALYTICS.label}
      hint={ANALYTICS.detail}
      value={on}
      onChange={(analytics) => void saveConsent({ ...currentConsent(), analytics })}
    />
  );
}
