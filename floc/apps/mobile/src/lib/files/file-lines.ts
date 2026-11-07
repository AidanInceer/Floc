import { formatDate, readIsoDate } from "@floc/core/dates/dates";
import { DOC_CATEGORIES, formatBytes, type DocCategory } from "@floc/core/documents/documents";

export function splitByVisibility<T extends { ownerId: string | null }>(files: T[]) {
  return {
    shared: files.filter((file) => file.ownerId === null),
    yours: files.filter((file) => file.ownerId !== null),
  };
}

export function filterVisible(counts: Record<DocCategory, number>, value: DocCategory | "all"): boolean {
  if (value !== "all") return true;
  return Object.values(counts).filter((n) => n > 0).length > 1;
}

export function metaLine(
  file: { sizeBytes: number; uploadedAt: string; uploadedBy: string; uploaderName: string },
  viewerId: string | undefined,
): string {
  const day = readIsoDate(file.uploadedAt.slice(0, 10));
  return [
    formatBytes(file.sizeBytes),
    file.uploadedBy === viewerId ? "You" : file.uploaderName,
    day ? formatDate(day, { weekday: false }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function inFilter<T extends { category: DocCategory }>(files: T[], value: DocCategory | "all"): T[] {
  return files.filter((file) => value === "all" || file.category === value);
}

export function countByCategory(files: { category: DocCategory }[]): Record<DocCategory, number> {
  return Object.fromEntries(
    DOC_CATEGORIES.map((category) => [category, files.filter((file) => file.category === category).length]),
  ) as Record<DocCategory, number>;
}

export function emptyWords(value: DocCategory | "all"): { shared: string; yours: string } {
  return value === "all"
    ? { shared: "No tickets or bookings yet.", yours: "Nothing of your own yet." }
    : { shared: "Nothing shared is filed here.", yours: "Nothing of yours is filed here." };
}
