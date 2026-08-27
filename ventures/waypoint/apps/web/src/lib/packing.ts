/**
 * How a shared packing line reads (ticket 219). Pure: the tab, the tests and
 * anything later that summarises packing all ask the same function, so the
 * three words can never drift apart between call sites.
 */
export type PackingStatus = "packed" | "claimed" | "unclaimed";

const PACKING_STATUS_LABELS: Record<PackingStatus, string> = {
  packed: "Packed",
  claimed: "Claimed",
  unclaimed: "Unclaimed",
};

/** Packed only when *every* claimer has ticked — one outstanding claim keeps the line open. */
export function packingStatus(
  claims: { packedAt: Date | null }[],
): PackingStatus {
  if (claims.length === 0) return "unclaimed";
  return claims.every((c) => c.packedAt !== null) ? "packed" : "claimed";
}

/**
 * What the badge says. One claimer only ever reads Claimed or Packed — a
 * count over a single person is noise. Two or more and the count is the whole
 * point: "1 of 3 packed" says how much of the line is still outstanding in a
 * way "Claimed" cannot (ticket 219).
 */
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

/**
 * How much you pack (ticket 220, parent 154). Scales counts only — a Light
 * trip and a Comfort trip pack the same *kinds* of thing, just fewer of them.
 * Ordered light-to-heavy, which is the order the pillbox renders.
 */
export const PACK_TIERS = ["light", "balanced", "comfort"] as const;
export type PackTier = (typeof PACK_TIERS)[number];

export const PACK_TIER_LABELS: Record<PackTier, string> = {
  light: "Light",
  balanced: "Balanced",
  comfort: "Comfort",
};

/** Anything off the list is not a tier — a hand-made POST must not invent one. */
export function parsePackTier(value: unknown): PackTier | null {
  const s = String(value ?? "");
  return (PACK_TIERS as readonly string[]).includes(s) ? (s as PackTier) : null;
}

/**
 * The tier that applies on one trip. The per-trip choice wins; null means
 * "never chosen here", which falls through to the profile default. Choosing on
 * a trip therefore never edits the default, so Light for a weekend leaves every
 * other trip alone (ticket 220).
 */
export function resolvePackTier(
  perTrip: PackTier | null,
  profileDefault: PackTier,
): PackTier {
  return perTrip ?? profileDefault;
}

/**
 * How many of a thing you're taking (ticket 220). One row carries its own
 * count rather than repeating itself five times: "5 — t-shirt" is what a
 * person means, and it is also what the generator in #221 wants to write.
 *
 * Floored at 1 because zero of a thing is a removal, which the row already has
 * a button for.
 */
export const MIN_PACK_QUANTITY = 1;
export const MAX_PACK_QUANTITY = 99;

export function clampPackQuantity(value: number): number {
  if (!Number.isFinite(value)) return MIN_PACK_QUANTITY;
  const whole = Math.trunc(value);
  return Math.min(MAX_PACK_QUANTITY, Math.max(MIN_PACK_QUANTITY, whole));
}

/** Only ever one step, either way — the row has two buttons, not a number field. */
export function parseQuantityStep(value: unknown): 1 | -1 | null {
  const s = String(value ?? "");
  if (s === "1") return 1;
  if (s === "-1") return -1;
  return null;
}

/**
 * What kind of thing it is (ticket 229). A fixed set, not free text: the point
 * is that two people's lists group the same way, and the generator has to be
 * able to file what it writes without inventing headings.
 *
 * Ordered the way a bag gets packed and the way the page renders them, with
 * `other` last because it's the bucket for anything typed by hand.
 */
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

/** Anything off the list falls to `other` rather than failing — a category is filing, not data worth rejecting a row over. */
export function parsePackCategory(value: unknown): PackCategory {
  const s = String(value ?? "");
  return (PACK_CATEGORIES as readonly string[]).includes(s)
    ? (s as PackCategory)
    : "other";
}

/** "all" is a real answer, not a missing one — an unknown filter shows everything rather than nothing (rule 11). */
export function parseCategoryFilter(value: unknown): PackCategory | "all" {
  const s = String(value ?? "");
  return (PACK_CATEGORIES as readonly string[]).includes(s)
    ? (s as PackCategory)
    : "all";
}


/**
 * How a packing list is ordered (ticket 229). `category` is the default and is
 * the only one that groups — the other two are flat, because a heading over a
 * list sorted by something else is two orderings fighting.
 *
 * `quantity` is offered on a personal bag only: a shared line has no count on
 * screen, so ordering by one would be sorting by something invisible.
 */
export const PACK_SORTS = ["category", "name", "quantity"] as const;
export type PackSort = (typeof PACK_SORTS)[number];

export const PACK_SORT_LABELS: Record<PackSort, string> = {
  category: "Category",
  name: "Name",
  quantity: "Most",
};

/** Falls back to `category` rather than failing — a bad sort in a URL is a shrug, not an error (rule 11). */
export function parsePackSort(value: unknown, allowed: readonly PackSort[]): PackSort {
  const s = String(value ?? "");
  return (allowed as readonly string[]).includes(s) ? (s as PackSort) : "category";
}

/**
 * The list in the chosen order. Name is a locale compare so "Trousers" files
 * next to "trousers"; quantity is most-first, since the reason to ask is to see
 * what you're carrying most of, and ties fall back to the name so the order is
 * stable between renders rather than however the rows arrived.
 */
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

/**
 * One list, filtered and ordered, ready to render (ticket 229).
 *
 * A `heading` of null on a chunk means "no heading" — sorting by name or
 * quantity produces one flat list, because a category heading over rows ordered
 * by something else is two orderings arguing in public. Sorting by category is
 * the grouping; there is no separate switch for it.
 *
 * A row copied in from a saved list heads its own group under that list's name
 * (ticket 230), after the fixed categories: you added "Photography" as a lump,
 * so it stays a lump you can find, rather than being scattered across four
 * headings the moment it lands.
 *
 * Empty groups are dropped, so a heading never sits over nothing.
 */
export type PackingLineGroup<T> = {
  /** Stable across renders — the category name, or `kit:<name>` for a saved list. */
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

  const byCategory: PackingLineGroup<T>[] = PACK_CATEGORIES.map((category) => ({
    key: category,
    heading: PACK_CATEGORY_LABELS[category],
    lines: kept.filter((l) => !l.kitName && l.category === category),
  }));

  const kits = new Map<string, T[]>();
  for (const l of kept) {
    if (!l.kitName) continue;
    const group = kits.get(l.kitName) ?? [];
    group.push(l);
    kits.set(l.kitName, group);
  }

  return [
    ...byCategory,
    ...[...kits].map(([name, group]) => ({
      key: `kit:${name}`,
      heading: name,
      lines: group,
    })),
  ].filter((g) => g.lines.length > 0);
}
