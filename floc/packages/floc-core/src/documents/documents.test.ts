import { describe, expect, it } from "vitest";

import {
  cleanFileName,
  formatBytes,
  kindLabel,
  rejectUpload,
  bytesMatchType,
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

describe("formatBytes", () => {
  it("rounds to a size a row can hold", () => {
    expect(formatBytes(240 * 1024)).toBe("240 KB");
    expect(formatBytes(1_153_434)).toBe("1.1 MB");
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
