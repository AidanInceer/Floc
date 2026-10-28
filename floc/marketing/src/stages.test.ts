import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { findPiece, isSlug, listPieces, movePiece } from "./stages.ts";

let content: string;
const make = (stage: string, slug: string) => {
  mkdirSync(join(content, stage, slug), { recursive: true });
  writeFileSync(join(content, stage, slug, "post.md"), "Hi");
};

beforeEach(() => {
  content = mkdtempSync(join(tmpdir(), "floc-marketing-"));
  for (const s of ["raw", "reviewed", "live"]) mkdirSync(join(content, s));
});

describe("isSlug", () => {
  it("takes lower-case words joined by hyphens", () => {
    expect(isSlug("v5-free-pro")).toBe(true);
  });

  it("refuses anything that could leave the content folder", () => {
    expect(isSlug("../live/x")).toBe(false);
    expect(isSlug("Big Name")).toBe(false);
    expect(isSlug("")).toBe(false);
  });
});

describe("listPieces", () => {
  it("lists every piece with its stage, in stage order then by name", () => {
    make("live", "a");
    make("raw", "c");
    make("raw", "b");
    expect(listPieces(content).map((p) => `${p.stage}/${p.slug}`)).toEqual(["raw/b", "raw/c", "live/a"]);
  });

  it("skips files such as .gitkeep", () => {
    writeFileSync(join(content, "raw", ".gitkeep"), "");
    expect(listPieces(content)).toEqual([]);
  });
});

describe("findPiece", () => {
  it("finds a piece in whichever stage holds it", () => {
    make("reviewed", "x");
    expect(findPiece(content, "x")?.stage).toBe("reviewed");
  });

  it("answers undefined for a missing piece", () => {
    expect(findPiece(content, "nope")).toBeUndefined();
  });
});

describe("movePiece", () => {
  it("moves the folder to the next stage", () => {
    make("raw", "x");
    const moved = movePiece(content, findPiece(content, "x")!, "reviewed");
    expect(moved.stage).toBe("reviewed");
    expect(findPiece(content, "x")?.dir).toBe(join(content, "reviewed", "x"));
  });

  it("refuses to overwrite a piece already in the target stage", () => {
    make("raw", "x");
    make("reviewed", "x");
    expect(() => movePiece(content, { slug: "x", stage: "raw", dir: join(content, "raw", "x") }, "reviewed")).toThrow(
      /already/,
    );
  });
});
