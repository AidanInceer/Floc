/**
 * The one line under each closed Settings row, the same on web and phone.
 * It answers the row, so a closed row tells you what is set without opening it.
 */
import { ringTicks, type Visibility } from "./visibility";

export function privacySummary({ isPrivate, rings }: { isPrivate: boolean; rings: Visibility[] }): string {
  if (isPrivate) return "Private, only your name shows";
  const friends = rings.filter((r) => ringTicks(r).friends).length;
  const travelled = rings.filter((r) => ringTicks(r).trip_members).length;
  return `Friends see ${friends} of ${rings.length}, travelled with ${travelled} of ${rings.length}`;
}

export function travelStyleSummary(tags: string[]): string {
  if (tags.length === 0) return "None picked";
  if (tags.length <= 2) return tags.join(" and ");
  return `${tags[0]}, ${tags[1]} and ${tags.length - 2} more`;
}

export function tripsSummary(packingStyle: string, currency: string): string {
  return `${packingStyle} packing, ${currency}`;
}

const NOTIFY_WORDS = { push: "Push", email: "Email", reminders: "Reminders" } as const;

export function notificationSummary(notify: Record<keyof typeof NOTIFY_WORDS, boolean>): string {
  const on = (Object.keys(NOTIFY_WORDS) as (keyof typeof NOTIFY_WORDS)[]).filter((k) => notify[k]);
  return on.length ? on.map((k) => NOTIFY_WORDS[k]).join(", ") : "All off";
}
