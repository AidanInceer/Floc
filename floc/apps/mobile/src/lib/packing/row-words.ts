export function groupCount(packed: (boolean | null)[]): { text: string; full: boolean } {
  if (packed.length === 0) return { text: "", full: false };
  if (packed.some((p) => p === null)) return { text: `${packed.length} to claim`, full: false };
  const done = packed.filter(Boolean).length;
  if (done === packed.length) return { text: "All packed", full: true };
  return { text: `${done}/${packed.length}`, full: false };
}

export function sectionCount(total: number, packed: number): string {
  if (packed > 0) return `${packed} of ${total} packed`;
  return total === 1 ? "1 thing" : `${total} things`;
}

/** The quiet second line of a shared row. The tick already says packed, so it is never repeated here. */
export function sharedSaid({ others }: { others: string[] }): string {
  return others.length > 0 ? `with ${others.join(", ")}` : "";
}

/** Why: the API does not say who added a shared line, so another person holding it stands in. */
export function needsRemoveConfirm(claims: { userId: string }[], viewerId: string | undefined): boolean {
  return claims.some((claim) => claim.userId !== viewerId);
}

export function splitFigures(text: string): { text: string; figure: boolean }[] {
  return text
    .split(/(\d+(?:\/\d+)?)/)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, figure: /^\d/.test(part) }));
}
