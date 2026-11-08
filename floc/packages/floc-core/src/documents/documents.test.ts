import { describe, expect, it } from "vitest";

import {
  cleanFileName,
  formatBytes,
  kindLabel,
  rejectForSpace,
  rejectUpload,
  renamedFileName,
  FREE_TRIP_STORAGE_BYTES,
  PRO_TRIP_STORAGE_BYTES,
  tripStorageBytes,
  bytesMatchType,
  DOC_CATEGORIES,
  DOC_CATEGORY_CHIPS,
  DOC_CATEGORY_LABELS,
  DOC_CATEGORY_SKINS,
  parseCategoryFilter,
  parseDocCategory,
} from "./documents";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? Array.from(new TextEncoder().encode(p)) : p)));

describe("bytesMatchType", () => {
  it.each([
    ["application/pdf", bytes("%PDF-1.7")],
    ["image/png", bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a])],
    ["image/jpeg", bytes([0xff, 0xd8, 0xff, 0xe0])],
    ["image/heic", bytes([0, 0, 0, 0x18], "ftypheic")],
    ["image/heic", bytes([0, 0, 0, 0x18], "ftypmif1")],
  ])("accepts real %s bytes", (type, data) => {
    expect(bytesMatchType(type, data)).toBe(true);
  });

  it("refuses HTML sent as a PDF", () => {
    expect(bytesMatchType("application/pdf", bytes("<html><script>"))).toBe(false);
  });

  it("refuses a PNG sent as a JPEG", () => {
    expect(bytesMatchType("image/jpeg", bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a]))).toBe(false);
  });

  it("refuses a type off the allow-list", () => {
    expect(bytesMatchType("text/html", bytes("%PDF-"))).toBe(false);
  });
});

describe("rejectUpload", () => {
  it("passes a PDF inside the cap", () => {
    expect(rejectUpload("application/pdf", 1024)).toBeNull();
  });

  it("refuses anything off the allow-list", () => {
    expect(rejectUpload("application/zip", 1024)).toMatch(/PDFs and images/);
  });

  it("refuses a file over 8 MB", () => {
    expect(rejectUpload("image/png", 8 * 1024 * 1024 + 1)).toMatch(/8 MB/);
  });

  it("takes a file of exactly 8 MB", () => {
    expect(rejectUpload("image/png", 8 * 1024 * 1024)).toBeNull();
  });
});

describe("cleanFileName", () => {
  it("flattens anything that looks like a path", () => {
    expect(cleanFileName("../../etc/passwd")).toBe(".. .. etc passwd");
  });

  it("falls back rather than returning an empty label", () => {
    expect(cleanFileName("   ")).toBe("Document");
  });
});

describe("renamedFileName (#364)", () => {
  it("keeps the old extension when the new name drops it, so a download still opens", () => {
    expect(renamedFileName("Ferry to Mull", "IMG_2231.PDF")).toBe("Ferry to Mull.PDF");
  });

  it("leaves a name alone that already ends in the extension, whatever its case", () => {
    expect(renamedFileName("Ferry.pdf", "scan.PDF")).toBe("Ferry.pdf");
  });

  it("adds nothing when the old name had no extension", () => {
    expect(renamedFileName("Ferry", "Document")).toBe("Ferry");
  });

  it("cleans the new name the way an upload's is cleaned", () => {
    expect(renamedFileName(' a/b"c ', "x.jpg")).toBe("a b c.jpg");
  });

  it("answers null for a name that is nothing once cleaned", () => {
    expect(renamedFileName("  \u0007 ", "x.jpg")).toBeNull();
    expect(renamedFileName(42n, "x.jpg")).toBeNull();
  });
});

describe("formatBytes", () => {
  it("rounds to a size a row can hold", () => {
    expect(formatBytes(240 * 1024)).toBe("240 KB");
    expect(formatBytes(1_153_434)).toBe("1.1 MB");
  });

  it("goes up to gigabytes, dropping a bare .0 (#285)", () => {
    expect(formatBytes(PRO_TRIP_STORAGE_BYTES)).toBe("1 GB");
    expect(formatBytes(1.5 * 1024 ** 3)).toBe("1.5 GB");
  });
});

describe("tripStorageBytes (#285)", () => {
  it("gives a free trip 200 MB and a Pro member more of their own", () => {
    expect(formatBytes(tripStorageBytes(false))).toBe("200 MB");
    expect(tripStorageBytes(true)).toBeGreaterThan(tripStorageBytes(false));
  });
});

describe("rejectForSpace (#285)", () => {
  const MB = 1024 * 1024;
  const quota = FREE_TRIP_STORAGE_BYTES;

  it("lets a file in that fits in what is left", () => {
    expect(rejectForSpace(quota - 5 * MB, 5 * MB, quota)).toBeNull();
  });

  it("names the space actually left when the file will not fit", () => {
    expect(rejectForSpace(quota - 3 * MB, 5 * MB, quota)).toBe(
      "This trip has 3 MB of its 200 MB left, and that file is 5 MB.",
    );
  });

  it("says nothing is left at the quota, and past it", () => {
    const full = "This trip has used all of its 200 MB. Remove a file to make room.";
    expect(rejectForSpace(quota, 1, quota)).toBe(full);
    expect(rejectForSpace(quota + MB, 1, quota)).toBe(full);
  });

  it("speaks to a Pro member about their own room on the trip (#523)", () => {
    const own = PRO_TRIP_STORAGE_BYTES;
    expect(rejectForSpace(own - 3 * MB, 5 * MB, own, true)).toBe(
      "You have 3 MB of your 1 GB left on this trip, and that file is 5 MB.",
    );
    expect(rejectForSpace(own, 1, own, true)).toBe(
      "Your files on this trip have used all of your 1 GB. Remove a file to make room.",
    );
  });
});

describe("kindLabel", () => {
  it("names the kind, so colour is never the only signal", () => {
    expect(kindLabel("image/jpeg")).toBe("IMG");
    expect(kindLabel("application/pdf")).toBe("PDF");
  });
});

describe("cleanFileName header safety", () => {
  it("caps a name that would blow up a response header", () => {
    expect(cleanFileName("a".repeat(5000))).toHaveLength(200);
  });

  it("strips the quote and backslash that would end the header value early", () => {
    expect(cleanFileName('in"voice\\x')).toBe("in voice x");
  });
});

describe("file categories", () => {
  it("files a hotel booking under Hotel", () => {
    expect(DOC_CATEGORIES).toContain("hotel");
    expect(DOC_CATEGORIES).not.toContain("stay");
    expect(DOC_CATEGORY_LABELS.hotel).toBe("Hotel");
  });

  it("reads the old stay key as hotel, so a phone build from before the rename still files right", () => {
    expect(parseDocCategory("stay")).toBe("hotel");
    expect(parseDocCategory("hotel")).toBe("hotel");
    expect(parseCategoryFilter("stay")).toBe("hotel");
  });

  it("still sends anything unknown to other, and a missing filter to all", () => {
    expect(parseDocCategory("ferry")).toBe("other");
    expect(parseCategoryFilter("ferry")).toBe("all");
  });

  it("gives each category one colour, the same on every surface: travel blue, hotel green, tickets yellow, admin red, other grey", () => {
    expect(DOC_CATEGORY_SKINS).toEqual({
      travel: "bg-pastel-blue text-pastel-blue-ink",
      hotel: "bg-pastel-green text-pastel-green-ink",
      tickets: "bg-pastel-yellow text-pastel-yellow-ink",
      admin: "bg-pastel-red text-pastel-red-ink",
      other: "bg-sheet-3 text-ink-soft",
    });
    for (const c of DOC_CATEGORIES) expect(DOC_CATEGORY_CHIPS[c]).toContain(DOC_CATEGORY_SKINS[c]);
  });
});
