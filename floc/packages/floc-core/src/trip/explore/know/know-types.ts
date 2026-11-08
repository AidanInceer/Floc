/** Good to know on an Explore listing: what a first-time traveller needs, in the order they need it. */

export const KNOW_STAGES = [
  "Before you book",
  "Before you fly",
  "Landing",
  "Money",
  "On the road",
  "At the stops",
  "Staying well",
  "Every day",
] as const;
export type KnowStageName = (typeof KNOW_STAGES)[number];

export const KNOW_ICONS = [
  "train", "car", "boat", "plane", "walk", "weather", "sun", "moon", "drop",
  "passport", "pin", "money", "ticket", "fuel", "shield", "health", "customs",
  "chat", "lock", "food",
] as const;
export type KnowIcon = (typeof KNOW_ICONS)[number];

export type KnowLink = { label: string; href: string };

/**
 * `title` says what to do, verb first. `text` is one or two plain sentences on why,
 * with figures marked `**30 days**` so the page sets them in the figure face.
 * `temporary` is set only for a tip that will stop being true, and says until when.
 */
export type KnowTip = { icon: KnowIcon; title: string; text: string; link?: KnowLink; temporary?: string };

/** A stop's tips carry no icon: the page leads them with the stop's pin. */
export type KnowStopTip = Omit<KnowTip, "icon">;
/** `place` is the listing stop's place, written the same. */
export type KnowStop = { place: string; tips: KnowStopTip[] };

export type KnowStage =
  | { stage: Exclude<KnowStageName, "At the stops">; tips: KnowTip[] }
  | { stage: "At the stops"; stops: KnowStop[] };

/** A UK government travel advice page: gov.uk/foreign-travel-advice/<slug>. */
export type KnowAdvice = { country: string; slug: string };

/** `checked` is the ISO day the facts were last checked against their sources. */
export type TripKnow = { checked: string; advice: KnowAdvice[]; stages: KnowStage[] };
