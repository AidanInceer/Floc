export function thingCount(n: number): string {
  return n === 1 ? "1 thing" : `${n} things`;
}

export function withOthers(names: string[]): string {
  return names.length > 0 ? `with ${names.join(", ")}` : "";
}

export function cubeCount(packed: number, total: number): { text: string; full: boolean } {
  const full = total > 0 && packed === total;
  return { text: full ? "All packed" : `${packed}/${total}`, full };
}

export function suggestedNote(lines: { suggested: boolean }[]): string | null {
  const n = lines.filter((line) => line.suggested).length;
  return n > 0 ? `${n} suggested` : null;
}
