import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { approve, publish, reopen, status, type Context } from "./commands.ts";
import { readRecord } from "./piece.ts";

let content: string;
let lines: string[];
const piece = (stage: string, slug: string, caption = "Sorted.", video = true) => {
  const dir = join(content, stage, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "post.md"), caption);
  if (video) writeFileSync(join(dir, "media.mp4"), "video");
};
const ctx = (over: Partial<Context> = {}): Context => ({
  content,
  log: (s) => lines.push(s),
  confirm: () => Promise.resolve(true),
  instagram: { publish: vi.fn(() => Promise.resolve({ mediaId: "M1", permalink: "https://www.instagram.com/reel/a/" })) },
  now: () => new Date("2026-10-27T10:00:00.000Z"),
  ...over,
});

beforeEach(() => {
  content = mkdtempSync(join(tmpdir(), "floc-cmd-"));
  for (const s of ["raw", "reviewed", "live"]) mkdirSync(join(content, s));
  lines = [];
});

describe("status", () => {
  it("lists pieces by stage and flags raw ones that fail the checks", () => {
    piece("raw", "a", "");
    piece("reviewed", "b");
    status(ctx());
    expect(lines).toEqual(["raw", "  a  (1 problem)", "reviewed", "  b", "live", "  —"]);
  });
});

describe("approve", () => {
  it("moves a raw piece that passes the checks to reviewed", () => {
    piece("raw", "a");
    expect(approve(ctx(), "a")).toBe(true);
    expect(existsSync(join(content, "reviewed", "a"))).toBe(true);
  });

  it("keeps a failing piece in raw and lists why", () => {
    piece("raw", "a", "Organize it");
    expect(approve(ctx(), "a")).toBe(false);
    expect(lines).toContain("  “Organize” is American; write “organise”.");
    expect(existsSync(join(content, "raw", "a"))).toBe(true);
  });

  it("only approves from raw", () => {
    piece("reviewed", "a");
    expect(approve(ctx(), "a")).toBe(false);
    expect(lines).toEqual(["a is in reviewed, not raw."]);
  });

  it("names an unknown piece", () => {
    expect(approve(ctx(), "ghost")).toBe(false);
    expect(lines).toEqual(["No piece called ghost."]);
  });
});

describe("reopen", () => {
  it("sends a reviewed piece back to raw", () => {
    piece("reviewed", "a");
    expect(reopen(ctx(), "a")).toBe(true);
    expect(existsSync(join(content, "raw", "a"))).toBe(true);
  });

  it("never reopens a live piece", () => {
    piece("live", "a");
    expect(reopen(ctx(), "a")).toBe(false);
  });
});

describe("publish", () => {
  it("posts a reviewed reel, records it and moves it to live", async () => {
    piece("reviewed", "a");
    const c = ctx();
    expect(await publish(c, "a", {})).toBe(true);
    expect(c.instagram).toHaveProperty("publish");
    const live = join(content, "live", "a");
    expect(readRecord(live)).toMatchObject({ platform: "instagram", mediaId: "M1", publishedAt: "2026-10-27T10:00:00.000Z" });
    expect(lines.at(-1)).toBe("Live: https://www.instagram.com/reel/a/");
  });

  it("only publishes from reviewed", async () => {
    piece("raw", "a");
    expect(await publish(ctx(), "a", {})).toBe(false);
    expect(lines).toEqual(["a is in raw. Approve it first: pnpm marketing approve a"]);
  });

  it("re-runs the checks, in case post.md changed after approval", async () => {
    piece("reviewed", "a", "");
    expect(await publish(ctx(), "a", {})).toBe(false);
    expect(lines).toContain("  Caption is empty.");
  });

  it("does nothing on a dry run", async () => {
    piece("reviewed", "a");
    const c = ctx();
    expect(await publish(c, "a", { dryRun: true })).toBe(true);
    expect(existsSync(join(content, "reviewed", "a"))).toBe(true);
    expect(lines.at(-1)).toBe("Dry run: nothing posted.");
  });

  it("does nothing when the confirm is declined", async () => {
    piece("reviewed", "a");
    expect(await publish(ctx({ confirm: () => Promise.resolve(false) }), "a", {})).toBe(false);
    expect(existsSync(join(content, "reviewed", "a"))).toBe(true);
  });

  it("skips the confirm with --yes, for a scheduled run", async () => {
    piece("reviewed", "a");
    const confirm = vi.fn(() => Promise.resolve(false));
    expect(await publish(ctx({ confirm }), "a", { yes: true })).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("names the missing settings instead of posting (rule 11)", async () => {
    piece("reviewed", "a");
    expect(await publish(ctx({ instagram: { missing: ["INSTAGRAM_USER_ID"] } }), "a", {})).toBe(false);
    expect(lines.at(-1)).toBe("Instagram is not set up. Add INSTAGRAM_USER_ID to floc/pipelines/marketing/.env.local.");
  });

  it("refuses stills until a public host exists", async () => {
    piece("reviewed", "a", "Sorted.", false);
    writeFileSync(join(content, "reviewed", "a", "s.png"), "");
    expect(await publish(ctx(), "a", {})).toBe(false);
    expect(lines.at(-1)).toMatch(/Stills cannot be published yet/);
  });

  it("leaves the piece in reviewed when Instagram fails", async () => {
    piece("reviewed", "a");
    const instagram = { publish: () => Promise.reject(new Error("Instagram: bad token")) };
    expect(await publish(ctx({ instagram }), "a", {})).toBe(false);
    expect(lines.at(-1)).toBe("Instagram: bad token");
    expect(existsSync(join(content, "reviewed", "a"))).toBe(true);
  });
});
