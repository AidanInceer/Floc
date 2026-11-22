import { describe, expect, it } from "vitest";

import {
  bytesMatchMedia,
  fillRows,
  groupMedia,
  MEDIA_LIMITS,
  mediaRatio,
  mediaType,
  refuseType,
  rejectMedia,
  videoClock,
} from "./media";

const held = { photosHeld: 0, usedBytes: 0 };
const MB = 1024 ** 2;

describe("the media a trip takes", () => {
  it.each([
    ["image/jpeg", "photo"],
    ["image/png", "photo"],
    ["image/webp", "photo"],
    ["video/mp4", "video"],
    ["video/quicktime", "video"],
    ["video/webm", "video"],
  ])("takes %s as a %s", (mime, kind) => {
    expect(mediaType(mime)?.kind).toBe(kind);
  });

  it("refuses any other type", () => {
    expect(mediaType("image/gif")).toBeNull();
    expect(mediaType("application/pdf")).toBeNull();
  });

  it("refuses HEIC, which cannot be stripped of EXIF yet, and says what to do", () => {
    expect(mediaType("image/heic")).toBeNull();
    expect(refuseType("image/heic")).toBe("HEIC photos cannot be added yet. Save it as a JPEG.");
  });
});

describe("the limits", () => {
  it("takes a free photo up to 10 MB", () => {
    expect(rejectMedia({ pro: false, kind: "photo", sizeBytes: 10 * MB, ...held })).toBeNull();
  });

  it("refuses a free photo past 10 MB and names the limit", () => {
    expect(rejectMedia({ pro: false, kind: "photo", sizeBytes: 10 * MB + 1, ...held })).toBe("Photos are capped at 10 MB on Free.");
  });

  it("refuses video on Free", () => {
    expect(rejectMedia({ pro: false, kind: "video", sizeBytes: MB, ...held })).toBe("Video needs Pro.");
  });

  it("refuses the 101st free photo", () => {
    expect(rejectMedia({ pro: false, kind: "photo", sizeBytes: MB, photosHeld: 100, usedBytes: 0 })).toBe("This trip holds its 100 photos.");
  });

  it("takes a Pro photo up to 50 MB and a video up to 1 GB", () => {
    expect(rejectMedia({ pro: true, kind: "photo", sizeBytes: 50 * MB, ...held })).toBeNull();
    expect(rejectMedia({ pro: true, kind: "video", sizeBytes: 1024 * MB, ...held })).toBeNull();
  });

  it("refuses a Pro video past 1 GB", () => {
    expect(rejectMedia({ pro: true, kind: "video", sizeBytes: 1024 * MB + 1, ...held })).toBe("Videos are capped at 1 GB.");
  });

  it("refuses a file past the trip's media space", () => {
    const usedBytes = MEDIA_LIMITS.pro.spaceBytes - MB;
    expect(rejectMedia({ pro: true, kind: "video", sizeBytes: 2 * MB, photosHeld: 0, usedBytes })).toMatch(/left/);
  });
});

describe("a file's first bytes", () => {
  const ftyp = (brand: string) => new Uint8Array([0, 0, 0, 24, ...Buffer.from(`ftyp${brand}`)]);

  it("knows a JPEG, PNG and WebP", () => {
    expect(bytesMatchMedia("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(bytesMatchMedia("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(true);
    expect(bytesMatchMedia("image/webp", new Uint8Array(Buffer.from("RIFF0000WEBP")))).toBe(true);
  });

  it("knows MP4, MOV and WebM", () => {
    expect(bytesMatchMedia("video/mp4", ftyp("isom"))).toBe(true);
    expect(bytesMatchMedia("video/quicktime", ftyp("qt  "))).toBe(true);
    expect(bytesMatchMedia("video/webm", new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]))).toBe(true);
  });

  it("refuses a file that only claims the type", () => {
    expect(bytesMatchMedia("image/jpeg", new Uint8Array(Buffer.from("<html>")))).toBe(false);
    expect(bytesMatchMedia("video/mp4", new Uint8Array(Buffer.from("<script>alert(1)")))).toBe(false);
  });
});

describe("media by stop", () => {
  const stops = [{ placeId: 1, no: 1, name: "Lisbon" }, { placeId: 2, no: 2, name: "Lagos" }];

  it("puts each picture on its stop and the rest on the whole trip", () => {
    const groups = groupMedia([{ id: 1, placeId: 2 }, { id: 2, placeId: 1 }, { id: 3, placeId: null }], stops);
    expect(groups.map((g) => [g.key, g.items.map((m) => m.id)])).toEqual([["1", [2]], ["2", [1]], ["trip", [3]]]);
  });

  it("moves a picture to the whole trip when its stop has gone", () => {
    const groups = groupMedia([{ id: 1, placeId: 9 }], stops);
    expect(groups.at(-1)?.items.map((m) => m.id)).toEqual([1]);
  });

  it("files a place the trip visits twice under its first stop", () => {
    const twice = [...stops, { placeId: 1, no: 3, name: "Lisbon" }];
    const groups = groupMedia([{ id: 1, placeId: 1 }], twice);
    expect(groups.map((g) => g.items.length)).toEqual([1, 0, 0, 0]);
  });
});

describe("a picture's shape and a video's length", () => {
  it("uses the real shape, inside sane bounds", () => {
    expect(mediaRatio(2048, 1024)).toBe(2);
    expect(mediaRatio(100, 1000)).toBe(0.6);
    expect(mediaRatio(1000, 100)).toBe(2.2);
  });

  it("falls back when the shape is unknown", () => {
    expect(mediaRatio(null, null)).toBe(1.5);
  });

  it("writes a video's length as minutes and seconds", () => {
    expect(videoClock(72)).toBe("1:12");
    expect(videoClock(null)).toBeNull();
  });
});

describe("tessellated rows", () => {
  const shape = (ratio: number, id = ratio) => ({ id, ratio });

  it("uses every picture once, in order", () => {
    const list = [1.5, 1.33, 1, 0.8, 1.33, 1.78, 1.5, 1.33].map((r, i) => shape(r, i));
    expect(fillRows(list, 4.6).flat().map((m) => m.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("never leaves one picture alone on a last row", () => {
    const list = [1.5, 1.5, 1.5, 1.5, 1.5].map((r, i) => shape(r, i));
    const rows = fillRows(list, 3);
    expect(rows.length).toBeGreaterThan(1);
    expect(rows.at(-1)!.length).toBeGreaterThan(1);
  });

  it("has no rows for no pictures", () => {
    expect(fillRows([], 4.6)).toEqual([]);
  });
});
