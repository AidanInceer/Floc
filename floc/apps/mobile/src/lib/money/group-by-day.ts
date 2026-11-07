/** Why a map, not runs: costs arrive in logged order, so runs repeated a day's heading further down. */
export function groupByDay<T extends { dayId?: number | null }>(
  expenses: readonly T[],
  dayLabel: (dayId: number | null) => string,
): { day: string; expenses: T[] }[] {
  const byDay = new Map<string, { day: string; undated: boolean; expenses: T[] }>();
  for (const expense of expenses) {
    const dayId = expense.dayId ?? null;
    const day = dayLabel(dayId);
    const group = byDay.get(day) ?? { day, undated: dayId === null, expenses: [] };
    group.expenses.push(expense);
    byDay.set(day, group);
  }
  const groups = [...byDay.values()];
  return [...groups.filter((g) => !g.undated), ...groups.filter((g) => g.undated)].map(({ day, expenses: list }) => ({ day, expenses: list }));
}
