import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { FREE_ACCOUNT_STORAGE_BYTES } from "@floc/core/documents/documents";
import { MEDIA_LIMITS } from "@floc/core/media/media";

import { db, schema } from "@/db";
import { findTripAccess, type TripAccess } from "@/server/access";
import { eraseAccount } from "@/server/auth/erase-account";
import { givePro, migrateTestDb, resetDb, seedScenario, type Scenario } from "@/test/db";

import { mediaTokenHolder, mintMediaToken } from "./media-link";
import { insertMedia, listMedia, liveMedia, mediaPlaceIds } from "./media-rows";
import { removeMedia, saveMedia } from "./media-save";

let world: Scenario;
let access: TripAccess;
const previousDir = process.env.FLOC_FILES_DIR;

beforeAll(migrateTestDb);
afterAll(() => { process.env.FLOC_FILES_DIR = previousDir; });

beforeEach(async () => {
  process.env.FLOC_FILES_DIR = await mkdtemp(path.join(tmpdir(), "floc-media-"));
  await resetDb();
  world = await seedScenario();
  access = (await findTripAccess(world.ours.id, world.member))!;
});

const stream = (bytes: Uint8Array) => new Blob([new Uint8Array(bytes)]).stream();
const stored = async () => {
  const dir = path.join(process.env.FLOC_FILES_DIR!, "media");
  return readdir(dir).catch(() => [] as string[]);
};

const jpegWithExif = () =>
  sharp({ create: { width: 3000, height: 1500, channels: 3, background: { r: 40, g: 120, b: 200 } } })
    .withExif({ IFD3: { GPSLatitudeRef: "N", GPSLatitude: "38/1 43/1 0/1" }, IFD0: { Make: "FlocCam" } })
    .jpeg()
    .toBuffer();

const upload = async (over: Partial<Parameters<typeof saveMedia>[1]> = {}, who = access) =>
  saveMedia(who, {
    body: stream(await jpegWithExif()),
    mimeType: "image/jpeg",
    declaredBytes: null,
    placeId: null,
    ...over,
  });

const fakeMp4 = () => new Uint8Array([0, 0, 0, 24, ...Buffer.from("ftypisom"), ...new Uint8Array(64)]);

describe("mediaPlaceIds", () => {
  it("names each place that holds a live photo once, and the whole trip as null", async () => {
    const place = await db.insert(schema.place).values({ name: "Porto", lat: 41.15, lng: -8.63, countryCode: "PT" }).returning({ id: schema.place.id }).get();
    await db.update(schema.day).set({ overnightPlaceId: place.id }).where(eq(schema.day.id, world.ours.dayId));
    await upload({ placeId: place.id });
    await upload({ placeId: place.id });
    await upload({ placeId: null });

    const ids = await mediaPlaceIds(world.ours.id);

    expect(ids.map((r) => r.placeId).sort()).toEqual([place.id, null].sort());
  });

  it("leaves out a removed photo", async () => {
    await upload({ placeId: null });
    await db.update(schema.tripMedia).set({ deletedAt: new Date() }).where(eq(schema.tripMedia.tripId, world.ours.id));
    expect(await mediaPlaceIds(world.ours.id)).toEqual([]);
  });
});

describe("adding a photo", () => {
  it("strips EXIF, keeps the shape and caps the long edge at 2048 px", async () => {
    const result = await upload();
    expect(result.error).toBeUndefined();
    const [row] = await listMedia(world.ours.id);
    expect([row.width, row.height]).toEqual([2048, 1024]);
    const live = await liveMedia(world.ours.id, row.id);
    const file = path.join(process.env.FLOC_FILES_DIR!, live!.storageKey);
    const meta = await sharp(file).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.width).toBe(2048);
  });

  it("refuses a file that only claims to be an image, and keeps nothing", async () => {
    const result = await upload({ body: stream(new TextEncoder().encode("<script>alert(1)</script>")) });
    expect(result.error).toBe("That file is not a photo or video Floc can take.");
    expect(await listMedia(world.ours.id)).toEqual([]);
    expect(await stored()).toEqual([]);
  });

  it("refuses a free photo past 10 MB while it streams, and keeps nothing", async () => {
    const big = new Uint8Array(10 * 1024 ** 2 + 1);
    big.set([0xff, 0xd8, 0xff]);
    const result = await upload({ body: stream(big) });
    expect(result.error).toBe("Photos are capped at 10 MB on Free.");
    expect(await stored()).toEqual([]);
  });

  it("refuses a stop that is not on this trip", async () => {
    const elsewhere = await db.insert(schema.place).values({ name: "Oslo" }).returning().get();
    const result = await upload({ placeId: elsewhere.id });
    expect(result.error).toBe("That stop is not on this trip.");
  });

  it("refuses an archived trip", async () => {
    await db.update(schema.trip).set({ archivedAt: new Date() }).where(eq(schema.trip.id, world.ours.id));
    const fresh = (await findTripAccess(world.ours.id, world.member))!;
    expect((await upload({}, fresh)).error).toBe("This trip is archived.");
  });
});

describe("adding a video", () => {
  it("needs Pro", async () => {
    const result = await upload({ body: stream(fakeMp4()), mimeType: "video/mp4" });
    expect(result.error).toBe("Video needs Pro.");
  });

  it("stores a Pro member's video as it came", async () => {
    await givePro(world.member);
    const bytes = fakeMp4();
    const result = await upload({ body: stream(bytes), mimeType: "video/mp4", durationSeconds: 12, width: 1920, height: 1080 });
    expect(result.error).toBeUndefined();
    const [row] = await listMedia(world.ours.id);
    expect(row).toMatchObject({ kind: "video", sizeBytes: bytes.byteLength, durationSeconds: 12, width: 1920 });
  });

  it("refuses a free member on a trip with a Pro member, who still sees that member's video (#523)", async () => {
    await givePro(world.admin);
    const admin = (await findTripAccess(world.ours.id, world.admin))!;
    expect((await upload({ body: stream(fakeMp4()), mimeType: "video/mp4" }, admin)).error).toBeUndefined();

    const result = await upload({ body: stream(fakeMp4()), mimeType: "video/mp4" });

    expect(result.error).toBe("Video needs Pro.");
    expect((await listMedia(world.ours.id)).map((m) => m.kind)).toEqual(["video"]);
  });
});

describe("whose room a picture fills (#523, ADR-083)", () => {
  const heldBy = (uploadedBy: string, sizeBytes: number, tripId = world.ours.id) =>
    insertMedia({ tripId, uploadedBy, kind: "photo", storageKey: `held-${uploadedBy}-${tripId}`, mimeType: "image/jpeg", sizeBytes });

  it("keeps a Pro member's pictures out of the group's space", async () => {
    await givePro(world.admin);
    await heldBy(world.admin, MEDIA_LIMITS.free.spaceBytes);

    expect((await upload()).error).toBeUndefined();
  });

  it("gives a free member the free limit however much a Pro member holds", async () => {
    await givePro(world.admin);
    await heldBy(world.outsider, MEDIA_LIMITS.free.spaceBytes);

    expect((await upload()).error).toMatch(/photo and video space left/);
  });

  it("when Pro ends, keeps the group's space and stops that person adding", async () => {
    await givePro(world.admin);
    await heldBy(world.admin, MEDIA_LIMITS.free.spaceBytes);
    await db.update(schema.subscription).set({ status: "canceled" }).where(eq(schema.subscription.userId, world.admin));
    const admin = (await findTripAccess(world.ours.id, world.admin))!;

    expect((await upload()).error).toBeUndefined();
    expect((await upload({}, admin)).error).toBe("Your free account has used all of its 1 GB. Remove a file to make room.");
  });

  it("counts pictures toward a free account's 1 GB, on every trip", async () => {
    await heldBy(world.member, FREE_ACCOUNT_STORAGE_BYTES, world.theirs.id);

    expect((await upload()).error).toBe("Your free account has used all of its 1 GB. Remove a file to make room.");
    expect(await stored()).toEqual([]);
  });
});

describe("removing and leaving", () => {
  it("lets the uploader delete their own picture and its files", async () => {
    await upload();
    const [row] = await listMedia(world.ours.id);
    await removeMedia(access, row.id);
    expect(await listMedia(world.ours.id)).toEqual([]);
    expect(await stored()).toEqual([]);
  });

  it("refuses another member's picture", async () => {
    await upload();
    const [row] = await listMedia(world.ours.id);
    const admin = (await findTripAccess(world.ours.id, world.admin))!;
    await expect(removeMedia(admin, row.id)).rejects.toThrow("Only the person who added it can delete it.");
    expect(await listMedia(world.ours.id)).toHaveLength(1);
  });

  it("deletes an erased person's media and files", async () => {
    await upload();
    await eraseAccount(world.member);
    expect(await listMedia(world.ours.id)).toEqual([]);
    expect(await stored()).toEqual([]);
  });
});

describe("media links", () => {
  it("names the person it was made for, for one trip and purpose", () => {
    const token = mintMediaToken("view", world.member, world.ours.id);
    expect(mediaTokenHolder(token, "view", world.ours.id)).toBe(world.member);
    expect(mediaTokenHolder(token, "upload", world.ours.id)).toBeNull();
    expect(mediaTokenHolder(token, "view", world.ours.id + 1)).toBeNull();
  });

  it("keeps a view link the same between polls, so pictures do not reload", () => {
    const start = 1_800_000_000_000;
    expect(mintMediaToken("view", world.member, world.ours.id, start + 1000)).toBe(mintMediaToken("view", world.member, world.ours.id, start + 31_000));
  });

  it("stops holding once it has run out", () => {
    const token = mintMediaToken("upload", world.member, world.ours.id, 0);
    expect(mediaTokenHolder(token, "upload", world.ours.id)).toBeNull();
  });
});
