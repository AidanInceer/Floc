const SETTINGS_SECTIONS = ["privacy", "about-you", "motion", "trips", "estimate", "billing", "notifications", "account", "data", "apps"] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

type Asked = { section?: string; billing?: string };

export function settingsSectionFor({ section, billing }: Asked, proOff: boolean): SettingsSection | null {
  const found = SETTINGS_SECTIONS.find((s) => s === (section ?? (billing ? "billing" : undefined)));
  if (!found) return null;
  return found === "billing" && proOff ? "privacy" : found;
}

export function settingsHref({ section, billing }: Asked): string {
  const query = new URLSearchParams();
  if (section) query.set("section", section);
  if (billing) query.set("billing", billing);
  const target = section ?? (billing ? "billing" : undefined);
  const search = query.size ? `?${query}` : "";
  return `/profile${search}${target ? `#settings-${target}` : ""}`;
}
