/** How a packing count reads on web and phone, so the two never word it differently. */
export function thingCount(n: number): string {
  return n === 1 ? "1 thing" : `${n} things`;
}

/** A cube's corner: packed over total, until every line is packed. */
export function cubeCount(packed: number, total: number): { text: string; full: boolean } {
  const full = total > 0 && packed === total;
  return { text: full ? "All packed" : `${packed}/${total}`, full };
}
