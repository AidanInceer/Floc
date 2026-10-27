import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { addNote, listPosts, readReview, removeNote, setStatus, type Note } from "./review.ts";

let scenes: string;
const now = new Date("2026-10-27T10:00:00.000Z");
const scene = (name: string, post?: string, key?: string, type?: string) => {
  mkdirSync(join(scenes, name), { recursive: true });
  const metas = [post && `<meta name="mk-post" content="${post}">`, key && `<meta name="mk-variant" content="${key}">`, type && `<meta name="mk-type" content="${type}">`].filter(Boolean).join("");
  writeFileSync(join(scenes, name, "index.html"), `<head><title>${name} title</title>${metas}<meta name="description" content="About ${name}"></head>`);
};

beforeEach(() => {
  scenes = mkdtempSync(join(tmpdir(), "floc-review-"));
});

describe("listPosts", () => {
  it("groups variants by post and orders keys naturally", () => {
    scene("promo-b10", "promo", "B10");
    scene("promo-b2", "promo", "B2");
    scene("promo-a", "promo", "A");
    expect(listPosts(scenes)).toEqual([{
      type: "Reel",
      post: "promo",
      variants: ["A", "B2", "B10"].map((key): unknown => expect.objectContaining({ key })),
    }]);
  });

  it("takes the post's type from its first variant", () => {
    scene("card-a", "card", "A", "Still");
    scene("card-b", "card", "B");
    expect(listPosts(scenes)[0].type).toBe("Still");
  });

  it("treats an unlabelled scene as its own post, and skips folders without a page", () => {
    scene("solo");
    mkdirSync(join(scenes, "empty"));
    mkdirSync(join(scenes, "_kit"));
    expect(listPosts(scenes)).toEqual([{
      type: "Reel",
      post: "solo",
      variants: [{ scene: "solo", key: "solo", title: "solo title", about: "About solo", review: { status: "exploring", notes: [] } }],
    }]);
  });
});

describe("addNote", () => {
  it("stores notes in time order, rounded to a tenth", () => {
    scene("a");
    addNote(scenes, "a", 4.26, " Too fast ", now);
    addNote(scenes, "a", 1, "Bigger type", now);
    expect(readReview(join(scenes, "a")).notes.map((n) => [n.t, n.text])).toEqual([[1, "Bigger type"], [4.3, "Too fast"]]);
  });

  it.each([
    ["missing", 1, "x", "No scene missing."],
    ["a", 1, "  ", "The note is empty."],
    ["a", 1, "x".repeat(2001), "A note holds at most 2000 characters."],
    ["a", -1, "x", "The time must be zero or more seconds."],
    ["a", Number.NaN, "x", "The time must be zero or more seconds."],
  ])("refuses %s at %s", (name, t, text, error) => {
    scene("a");
    expect(addNote(scenes, name, t, text, now)).toBe(error);
  });
});

describe("removeNote", () => {
  it("removes one note by id", () => {
    scene("a");
    const note = addNote(scenes, "a", 1, "Gone", now) as Note;
    addNote(scenes, "a", 2, "Kept", now);
    expect(removeNote(scenes, "a", note.id)).toBeUndefined();
    expect(readReview(join(scenes, "a")).notes.map((n) => n.text)).toEqual(["Kept"]);
  });

  it("says when the scene or note is missing", () => {
    scene("a");
    expect(removeNote(scenes, "a", "nope")).toBe("No note nope.");
    expect(removeNote(scenes, "../a", "nope")).toBe("No scene ../a.");
  });
});

describe("setStatus", () => {
  it("chosen moves the post's old pick back to exploring and keeps notes", () => {
    scene("p-a", "p", "A");
    scene("p-b", "p", "B");
    scene("q-a", "q", "A");
    setStatus(scenes, "p-a", "chosen");
    setStatus(scenes, "q-a", "chosen");
    addNote(scenes, "p-a", 1, "Keep me", now);
    setStatus(scenes, "p-b", "chosen");
    expect(readReview(join(scenes, "p-a"))).toMatchObject({ status: "exploring", notes: [{ text: "Keep me" }] });
    expect(readReview(join(scenes, "p-b")).status).toBe("chosen");
    expect(readReview(join(scenes, "q-a")).status).toBe("chosen");
  });

  it("parks a variant", () => {
    scene("a");
    expect(setStatus(scenes, "a", "parked")).toBeUndefined();
    expect(readReview(join(scenes, "a")).status).toBe("parked");
  });

  it("refuses an unknown status or scene", () => {
    scene("a");
    expect(setStatus(scenes, "a", "live")).toBe("Status is one of exploring, chosen, parked.");
    expect(setStatus(scenes, "b", "parked")).toBe("No scene b.");
  });
});
