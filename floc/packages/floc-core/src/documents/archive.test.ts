import { describe, expect, it } from "vitest";

import { FILE_ARCHIVE_DAYS, fileArchiveCutoff, fileArchiveDaysLeft, fileArchiveNote, filesToTrim } from "./archive";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(Date.UTC(2027, 0, 10, 12));
const ago = (days: number) => new Date(NOW.getTime() - days * DAY);

describe("a file's week in the archive", () => {
  it("counts whole days left, so the last day reads 1", () => {
    expect(fileArchiveDaysLeft(NOW, NOW)).toBe(FILE_ARCHIVE_DAYS);
    expect(fileArchiveDaysLeft(ago(6.5), NOW)).toBe(1);
    expect(fileArchiveDaysLeft(ago(8), NOW)).toBe(0);
  });

  it("puts the cutoff a week back", () => {
    expect(fileArchiveCutoff(NOW)).toEqual(ago(FILE_ARCHIVE_DAYS));
  });

  it("says when the files go, in one line", () => {
    expect(fileArchiveNote).toBe("Deleted for good after 7 days");
  });
});

describe("an archive that has outgrown the trip's space", () => {
  const file = (id: number, sizeBytes: number, days: number) => ({ id, sizeBytes, archivedAt: ago(days) });

  it("lets nothing go while it fits", () => {
    expect(filesToTrim([file(1, 40, 3), file(2, 50, 1)], 100)).toEqual([]);
  });

  it("lets the oldest go first, and only as many as it takes", () => {
    const files = [file(1, 40, 1), file(2, 50, 5), file(3, 30, 3)];
    expect(filesToTrim(files, 100).map((f) => f.id)).toEqual([2]);
    expect(filesToTrim(files, 40).map((f) => f.id)).toEqual([2, 3]);
  });
});
