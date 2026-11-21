export function fitCount(widths: number[], room: number, gap: number, menu: number): number {
  const span = (n: number) => widths.slice(0, n).reduce((sum, w) => sum + w, 0) + gap * Math.max(0, n - 1);
  if (span(widths.length) <= room) return widths.length;
  let n = widths.length - 1;
  while (n > 0 && span(n) + gap + menu > room) n -= 1;
  return n;
}

export function openFirst<T extends { nudged: boolean }>(people: T[]): T[] {
  return [...people.filter((p) => !p.nudged), ...people.filter((p) => p.nudged)];
}
