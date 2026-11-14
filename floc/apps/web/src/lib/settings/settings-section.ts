const SETTINGS_SECTIONS = ["privacy", "about-you", "trips", "billing", "notifications", "account", "data", "delete"] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

type Asked = { section?: string; billing?: string };

/** The row a link opens on Profile. A checkout return opens Pro; with Pro switched off an old Pro link opens Privacy. */
export function settingsSectionFor({ section, billing }: Asked, proOff: boolean): SettingsSection | null {
  const found = SETTINGS_SECTIONS.find((s) => s === (section ?? (billing ? "billing" : undefined)));
  if (!found) return null;
  return found === "billing" && proOff ? "privacy" : found;
}

/** Where an old /settings link lands now that settings sit on Profile. */
export function settingsHref({ section, billing }: Asked): string {
  const query = new URLSearchParams();
  if (section) query.set("section", section);
  if (billing) query.set("billing", billing);
  const target = section ?? (billing ? "billing" : undefined);
  const search = query.size ? `?${query}` : "";
  return `/profile${search}${target ? `#settings-${target}` : ""}`;
}
