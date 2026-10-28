import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { checkPiece, mediaOf, readCaption, readRecord, sha256, writeRecord } from "./piece.ts";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "floc-piece-"));
});

describe("mediaOf", () => {
  it("is a reel when the piece holds one video", () => {
    writeFileSync(join(dir, "media.mp4"), "v");
    expect(mediaOf(dir)).toEqual({ kind: "reel", file: join(dir, "media.mp4") });
  });

  it("is stills when it holds images only, in name order", () => {
    writeFileSync(join(dir, "b.png"), "");
    writeFileSync(join(dir, "a.jpg"), "");
    expect(mediaOf(dir)).toEqual({ kind: "stills", files: [join(dir, "a.jpg"), join(dir, "b.png")] });
  });

  it("is none with no media, or with two videos", () => {
    expect(mediaOf(dir)).toEqual({ kind: "none" });
    writeFileSync(join(dir, "a.mp4"), "");
    writeFileSync(join(dir, "b.mp4"), "");
    expect(mediaOf(dir)).toEqual({ kind: "none" });
  });
});

describe("readCaption", () => {
  it("reads post.md, trimmed", () => {
    writeFileSync(join(dir, "post.md"), "\nHello\n\n");
    expect(readCaption(dir)).toBe("Hello");
  });

  it("is empty when post.md is missing", () => {
    expect(readCaption(dir)).toBe("");
  });
});

describe("checkPiece", () => {
  it("joins caption problems with a missing-media problem", () => {
    expect(checkPiece(dir)).toEqual(["Caption is empty.", "No media: add one .mp4, or one or more .png/.jpg."]);
  });

  it("passes a captioned reel", () => {
    writeFileSync(join(dir, "post.md"), "Sorted.");
    writeFileSync(join(dir, "media.mp4"), "v");
    expect(checkPiece(dir)).toEqual([]);
  });
});

describe("publish record", () => {
  it("writes and reads published.json", () => {
    const record = { platform: "instagram" as const, mediaId: "1", permalink: "https://x", publishedAt: "2026-10-27T10:00:00.000Z", sha256: "ab" };
    writeRecord(dir, record);
    expect(readRecord(dir)).toEqual(record);
    expect(readFileSync(join(dir, "published.json"), "utf8").endsWith("\n")).toBe(true);
  });

  it("has no record before publishing", () => {
    expect(readRecord(dir)).toBeUndefined();
  });
});

describe("sha256", () => {
  it("hashes the file bytes", () => {
    writeFileSync(join(dir, "f"), "abc");
    expect(sha256(join(dir, "f"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
