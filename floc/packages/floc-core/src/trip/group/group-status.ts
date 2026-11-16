export function owingUserIds(balances: Record<string, Record<string, number>>): string[] {
  return Array.from(
    new Set(
      Object.values(balances).flatMap((book) =>
        Object.entries(book)
          .filter(([, amount]) => amount !== 0)
          .map(([userId]) => userId),
      ),
    ),
  );
}

export function groupStatuses({
  needDates,
  owing,
}: {
  needDates: string[];
  owing: string[];
}): Map<string, string[]> {
  const statuses = new Map<string, string[]>();
  const add = (userId: string, word: string) =>
    statuses.set(userId, [...(statuses.get(userId) ?? []), word]);
  for (const userId of needDates) add(userId, "Dates to add");
  for (const userId of owing) add(userId, "Settling up");
  return statuses;
}
