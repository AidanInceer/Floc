import { normaliseTag } from "./tags";

export const VIBE_TAGS = [
  "early starts",
  "late nights",
  "city breaks",
  "beaches",
  "road trips",
  "hiking",
  "food first",
  "museums",
  "festivals",
  "slow mornings",
] as const;

type VibeTag = (typeof VIBE_TAGS)[number];

export const VIBE_TAG_GROUPS: { name: string; tags: VibeTag[] }[] = [
  { name: "Pace", tags: ["early starts", "slow mornings", "late nights"] },
  { name: "Places", tags: ["city breaks", "beaches", "hiking", "road trips"] },
  { name: "Things to do", tags: ["food first", "museums", "festivals"] },
];

export function parseVibeTags(input: (string | null | undefined)[]): string[] {
  const allowed = new Set<string>(VIBE_TAGS);
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const tag = normaliseTag(raw);
    if (!allowed.has(tag) || out.includes(tag)) continue;
    out.push(tag);
  }
  return out;
}

export function readVibeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(VIBE_TAGS);
  return value.filter(
    (t): t is string => typeof t === "string" && allowed.has(t),
  );
}
