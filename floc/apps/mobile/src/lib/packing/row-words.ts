import { cubeCount, thingCount } from "@floc/core/packing/packing-words";

export function groupCount(packed: (boolean | null)[]): { text: string; full: boolean } {
  if (packed.length === 0) return { text: "", full: false };
  if (packed.some((p) => p === null)) return { text: `${packed.length} to claim`, full: false };
  return cubeCount(packed.filter(Boolean).length, packed.length);
}

export function sectionCount(total: number, packed: number): string {
  if (packed > 0) return `${packed} of ${total} packed`;
  return thingCount(total);
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
    .split(/(\d[\d/]*)/)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, figure: /^\d/.test(part) }));
}
