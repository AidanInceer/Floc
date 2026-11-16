import { asText } from "../text/text";

export type PackingStatus = "packed" | "claimed" | "unclaimed";

const PACKING_STATUS_LABELS: Record<PackingStatus, string> = {
  packed: "Packed",
  claimed: "Claimed",
  unclaimed: "Unclaimed",
};

export type PackingClaimTick = { packedAt: Date | null } | { packed: boolean };

const ticked = (claim: PackingClaimTick): boolean =>
  "packed" in claim ? claim.packed : claim.packedAt !== null;

export function packingStatus(claims: PackingClaimTick[]): PackingStatus {
  if (claims.length === 0) return "unclaimed";
  return claims.every(ticked) ? "packed" : "claimed";
}

export function packedLineCount(lines: { claims: PackingClaimTick[] }[]): number {
  return lines.filter((line) => packingStatus(line.claims) === "packed").length;
}

export function packingStatusLabel(
  claims: { packedAt: Date | null }[],
): string {
  const status = packingStatus(claims);
  if (status !== "claimed" || claims.length < 2) {
    return PACKING_STATUS_LABELS[status];
  }
  const packed = claims.filter((c) => c.packedAt !== null).length;
  return `${packed} of ${claims.length} packed`;
}

export const PACK_TIERS = ["light", "balanced", "comfort"] as const;
export type PackTier = (typeof PACK_TIERS)[number];

export const PACK_TIER_LABELS: Record<PackTier, string> = {
  light: "Light",
  balanced: "Balanced",
  comfort: "Comfort",
};

export function parsePackTier(value: unknown): PackTier | null {
  const s = asText(value);
  return (PACK_TIERS as readonly string[]).includes(s) ? (s as PackTier) : null;
}

export function resolvePackTier(
  perTrip: PackTier | null,
  profileDefault: PackTier,
): PackTier {
  return perTrip ?? profileDefault;
}

export const PACK_ORIGINS = ["suggested"] as const;
export type PackOrigin = (typeof PACK_ORIGINS)[number];

export const NO_PACK_LABEL = "A thing to pack needs a name.";

export const MIN_PACK_QUANTITY = 1;
export const MAX_PACK_QUANTITY = 99;

export function clampPackQuantity(value: number): number {
  if (!Number.isFinite(value)) return MIN_PACK_QUANTITY;
  const whole = Math.trunc(value);
  return Math.min(MAX_PACK_QUANTITY, Math.max(MIN_PACK_QUANTITY, whole));
}

export function parseQuantityStep(value: unknown): 1 | -1 | null {
  const s = asText(value);
  if (s === "1") return 1;
  if (s === "-1") return -1;
  return null;
}

export const PACK_CATEGORIES = [
  "essentials",
  "clothes",
  "toiletries",
  "accessories",
  "other",
] as const;
export type PackCategory = (typeof PACK_CATEGORIES)[number];

export const PACK_CATEGORY_LABELS: Record<PackCategory, string> = {
  essentials: "Essentials",
  clothes: "Clothes",
  toiletries: "Toiletries",
  accessories: "Accessories",
  other: "Other",
};

export function parsePackCategory(value: unknown): PackCategory {
  const s = asText(value);
  return (PACK_CATEGORIES as readonly string[]).includes(s)
    ? (s as PackCategory)
    : "other";
}

export function parseCategoryFilter(value: unknown): PackCategory | "all" {
  const s = asText(value);
  return (PACK_CATEGORIES as readonly string[]).includes(s)
    ? (s as PackCategory)
    : "all";
}

export const PACK_SORTS = ["category", "name", "quantity"] as const;
export type PackSort = (typeof PACK_SORTS)[number];

export function sortPackingLines<T extends { label: string; quantity?: number }>(
  lines: T[],
  sort: PackSort,
): T[] {
  const byName = (a: T, b: T) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" });

  if (sort === "name") return [...lines].sort(byName);
  if (sort === "quantity") {
    return [...lines].sort(
      (a, b) => (b.quantity ?? 1) - (a.quantity ?? 1) || byName(a, b),
    );
  }
  return lines;
}

export type PackingLineGroup<T> = {
  key: string;
  heading: string | null;
  lines: T[];
};

export function viewPackingLines<
  T extends {
    label: string;
    category: PackCategory;
    quantity?: number;
    kitName?: string | null;
  },
>(
  lines: T[],
  view: { sort: PackSort; category: PackCategory | "all" },
): PackingLineGroup<T>[] {
  const kept =
    view.category === "all"
      ? lines
      : lines.filter((l) => l.category === view.category);

  if (view.sort !== "category") {
    const sorted = sortPackingLines(kept, view.sort);
    return sorted.length > 0 ? [{ key: "flat", heading: null, lines: sorted }] : [];
  }

  return packingCubes(kept, []).map(({ key, heading, lines: grouped }) => ({ key, heading, lines: grouped }));
}

export type PackingCube<L, I> = { key: string; heading: string; lines: L[]; ideas: I[] };

export function packingCubes<
  L extends { category: PackCategory; kitName?: string | null },
  I extends { category: PackCategory },
>(lines: L[], ideas: I[]): PackingCube<L, I>[] {
  const byCategory = PACK_CATEGORIES.map((category) => ({
    key: category,
    heading: PACK_CATEGORY_LABELS[category],
    lines: lines.filter((l) => !l.kitName && l.category === category),
    ideas: ideas.filter((i) => i.category === category),
  }));

  const kits = new Map<string, L[]>();
  for (const l of lines) {
    if (l.kitName) kits.set(l.kitName, [...(kits.get(l.kitName) ?? []), l]);
  }

  return [
    ...byCategory,
    ...[...kits].map(([name, group]) => ({ key: `kit:${name}`, heading: name, lines: group, ideas: [] as I[] })),
  ].filter((cube) => cube.lines.length > 0 || cube.ideas.length > 0);
}
