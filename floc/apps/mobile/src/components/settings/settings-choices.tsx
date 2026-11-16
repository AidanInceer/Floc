import { CONSENT_CATEGORIES, type ConsentChoice } from "@floc/core/consent/consent";
import { View } from "react-native";

import { Toggle } from "@/components/system/ui";
import { saveConsent } from "@/lib/consent/consent";
import { useConsentChoice } from "@/components/consent/use-consent-choice";
import { space } from "@/lib/theme";

const OPTIONAL = CONSENT_CATEGORIES.filter((category) => category.key !== "necessary");

export const choicesSummary = (choice: ConsentChoice): string =>
  choice.functional && choice.analytics ? "All on" : choice.functional || choice.analytics ? "1 of 2 on" : "Off";

export function SettingsChoices() {
  const choice = useConsentChoice();
  return (
    <View style={{ gap: space.sm }}>
      {OPTIONAL.map((category) => (
        <Toggle
          key={category.key}
          label={category.label}
          hint={category.detail}
          value={choice[category.key]}
          onChange={(on) => void saveConsent({ ...choice, [category.key]: on })}
        />
      ))}
    </View>
  );
}
