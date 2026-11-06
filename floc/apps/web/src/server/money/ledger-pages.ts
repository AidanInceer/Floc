export async function ledgerPages<T>(read: (offset: number, size: number) => Promise<T[]>, size: number): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += size) {
    const page = await read(offset, size);
    rows.push(...page);
    if (page.length < size) return rows;
  }
}
