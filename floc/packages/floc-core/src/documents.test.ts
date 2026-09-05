import { describe, expect, it } from "vitest";

import {
  cleanFileName,
  formatBytes,
  kindLabel,
  rejectUpload,
} from "./documents";

describe("rejectUpload", () => {
  it("passes a PDF inside the cap", () => {
    expect(rejectUpload("application/pdf", 1024)).toBeNull();
  });

  it("refuses anything off the allow-list", () => {
    expect(rejectUpload("application/zip", 1024)).toMatch(/PDFs and images/);
  });

  it("refuses a file over 10 MB", () => {
    expect(rejectUpload("image/png", 11 * 1024 * 1024)).toMatch(/10 MB/);
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
