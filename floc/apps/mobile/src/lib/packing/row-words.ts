import { cubeCount } from "@floc/core/packing/packing-words";

export function groupCount(packed: (boolean | null)[]): { text: string; full: boolean } {
  if (packed.length === 0) return { text: "", full: false };
  if (packed.some((p) => p === null)) return { text: `${packed.length} to claim`, full: false };
  return cubeCount(packed.filter(Boolean).length, packed.length);
}

export function sharedSaid({ others }: { others: string[] }): string {
  return others.length > 0 ? `with ${others.join(", ")}` : "";
}

export function needsRemoveConfirm(claims: { userId: string }[], viewerId: string | undefined): boolean {
  return claims.some((claim) => claim.userId !== viewerId);
}

export function splitFigures(text: string): { text: string; figure: boolean }[] {
  return text
    .split(/(\d[\d/]*)/)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, figure: /^\d/.test(part) }));
}
