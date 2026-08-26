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
