import type { Privacy, Visibility } from "@/components/settings/settings-privacy";

const RING_WORDS: Record<Visibility, string> = {
  private: "Only me",
  friends: "Friends",
  trip_members: "Travelled with",
};

export function privacySummary(privacy: Privacy): string {
  if (privacy.isPrivate) return "Private";
  const rings = new Set([
    privacy.visibilityVibeTags,
    privacy.visibilityTravelMap,
    privacy.visibilityFriends,
  ]);
  const [only] = rings;
  return rings.size === 1 && only ? RING_WORDS[only] : "Mixed";
}

const counted = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function aboutSummary(tags: number, diets: number): string {
  const parts = [tags ? counted(tags, "tag") : null, diets ? counted(diets, "diet") : null];
  return parts.filter(Boolean).join(" · ") || "None set";
}

export function tripsSummary(packingStyle: string, currency: string): string {
  return `${packingStyle} · ${currency}`;
}

export function emailSummary(notify: Record<string, boolean>): string {
  const values = Object.values(notify);
  const on = values.filter(Boolean).length;
  if (on === values.length) return "All on";
  if (on === 0) return "All off";
  return `${on} of ${values.length} on`;
}
