/** Empty cells before the 1st in a Monday-first month grid. `month` is 1–12. */
export function leadingBlanks(year: number, month: number): number {
  const weekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (weekday + 6) % 7;
}
