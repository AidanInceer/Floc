export function pageToOpen<P extends { id: number; lastModifiedAt: Date }>(pages: readonly P[], asked: number | null): P | undefined {
  const named = pages.find((p) => p.id === asked);
  if (named) return named;
  return pages.reduce<P | undefined>((latest, p) => (!latest || p.lastModifiedAt > latest.lastModifiedAt ? p : latest), undefined);
}
