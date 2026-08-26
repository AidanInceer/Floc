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
