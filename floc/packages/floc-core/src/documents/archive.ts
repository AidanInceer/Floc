/** Why: a removed file used to leave the disk at once, so one member could wipe a trip's bookings (ADR-048). */
export const FILE_ARCHIVE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export const fileArchiveNote = `Deleted for good after ${FILE_ARCHIVE_DAYS} days`;

/** Files archived after this are still in the archive. */
export function fileArchiveCutoff(now: Date): Date {
  return new Date(now.getTime() - FILE_ARCHIVE_DAYS * DAY_MS);
}

/** Whole days until an archived file goes for good, rounded up so the last day reads "1". */
export function fileArchiveDaysLeft(archivedAt: Date, now: Date): number {
  const left = archivedAt.getTime() + FILE_ARCHIVE_DAYS * DAY_MS - now.getTime();
  return Math.max(0, Math.ceil(left / DAY_MS));
}

export function fileArchiveLeftLabel(archivedAt: Date, now: Date): string {
  const days = fileArchiveDaysLeft(archivedAt, now);
  return days === 1 ? "1 day left" : `${days} days left`;
}

type Archived = { sizeBytes: number; archivedAt: Date };

/** Why: archived files are free of the quota, so upload-then-archive could fill the disk. Past the trip's own space the oldest go early. */
export function filesToTrim<F extends Archived>(archived: readonly F[], quotaBytes: number): F[] {
  let over = archived.reduce((sum, file) => sum + file.sizeBytes, 0) - quotaBytes;
  const gone: F[] = [];
  for (const file of [...archived].sort((a, b) => a.archivedAt.getTime() - b.archivedAt.getTime())) {
    if (over <= 0) break;
    gone.push(file);
    over -= file.sizeBytes;
  }
  return gone;
}
