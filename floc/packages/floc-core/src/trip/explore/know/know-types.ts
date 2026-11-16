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

export type KnowTip = { icon: KnowIcon; title: string; text: string; link?: KnowLink; temporary?: string };

export type KnowStopTip = Omit<KnowTip, "icon">;
export type KnowStop = { place: string; tips: KnowStopTip[] };

export type KnowStage =
  | { stage: Exclude<KnowStageName, "At the stops">; tips: KnowTip[] }
  | { stage: "At the stops"; stops: KnowStop[] };

export type KnowAdvice = { country: string; slug: string };

export type TripKnow = { checked: string; advice: KnowAdvice[]; stages: KnowStage[] };
