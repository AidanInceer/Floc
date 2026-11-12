import { formatDate, readIsoDate } from "@floc/core/dates/dates";
import { fileArchiveLeftLabel } from "@floc/core/documents/archive";
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

/** Two lines, as the web draws below sm: the whole thing is too long for one row beside Restore, and neither half may be cut. */
export function archivedMetaLines(
  file: { sizeBytes: number; uploadedBy: string; uploaderName: string; ownerId: string | null; archivedAt: string },
  viewerId: string | undefined,
  now: Date,
): [string, string] {
  const size = formatBytes(file.sizeBytes);
  const who = file.uploadedBy === viewerId ? "You" : file.uploaderName;
  return [
    `${fileArchiveLeftLabel(new Date(file.archivedAt), now)} · ${file.ownerId ? "Yours" : "Shared"}`,
    // Why no name on a private file: only its owner sees it, so "Yours" has already said who.
    file.ownerId ? size : `${who} · ${size}`,
  ];
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
