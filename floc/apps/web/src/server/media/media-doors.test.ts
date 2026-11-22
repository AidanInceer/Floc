import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/media/[tripId]/[mediaId]/route";
import { POST } from "@/app/api/media/[tripId]/route";
import { deleteMedia, mediaUploadToken } from "@/app/trip/[id]/overview/media/actions";
import { db, schema } from "@/db";
import { findTripAccess } from "@/server/access";
import { webPort } from "@/server/api-port/api-port";
import { expectNotFound, givePro, migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";

import { mintMediaToken } from "./media-link";
import { listMedia, liveMedia } from "./media-rows";
import { saveMedia } from "./media-save";
import { fileSize, mediaPath, parseRange } from "./media-store";
import { readMediaView } from "./media-view";

let world: Scenario;
const previousDir = process.env.FLOC_FILES_DIR;

beforeAll(migrateTestDb);
afterAll(() => { process.env.FLOC_FILES_DIR = previousDir; });

beforeEach(async () => {
  process.env.FLOC_FILES_DIR = await mkdtemp(path.join(tmpdir(), "floc-media-doors-"));
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

const jpeg = () =>
  sharp({ create: { width: 900, height: 600, channels: 3, background: { r: 20, g: 90, b: 160 } } }).jpeg().toBuffer();
const mp4 = () => new Uint8Array([0, 0, 0, 24, ...Buffer.from("ftypisom"), ...new Uint8Array(84)]);

const trip = () => world.ours.id;
const postParams = (tripId: number | string = trip()) => ({ params: Promise.resolve({ tripId: String(tripId) }) });
const getParams = (mediaId: number | string, tripId: number | string = trip()) => ({
  params: Promise.resolve({ tripId: String(tripId), mediaId: String(mediaId) }),
});

async function post(token: string | null, query = "", body?: BodyInit | null, type = "image/jpeg") {
  const headers: Record<string, string> = { "content-type": type };
  if (token) headers["x-floc-media-token"] = token;
  const sent = body === undefined ? new Uint8Array(await jpeg()) : body;
  return POST(new Request(`http://floc.test/api/media/${trip()}${query}`, { method: "POST", headers, body: sent }), postParams());
}

const uploadToken = (who = world.member) => mintMediaToken("upload", who, trip());
const get = (id: number, query = "", headers: Record<string, string> = {}) =>
  GET(new Request(`http://floc.test/api/media/${trip()}/${id}${query}`, { headers }), getParams(id));

async function savedPhoto(): Promise<number> {
  const response = await post(uploadToken());
  return ((await response.json()) as { id: number }).id;
}

async function savedVideo(): Promise<number> {
  await givePro(world.member);
  const access = (await findTripAccess(trip(), world.member))!;
  const saved = await saveMedia(access, {
    body: new Blob([mp4()]).stream(),
    mimeType: "video/mp4",
    declaredBytes: null,
    placeId: null,
    width: 1280,
    height: 720,
    durationSeconds: 72,
  });
  return saved.id!;
}

async function stopOnTrip(): Promise<number> {
  const place = await db.insert(schema.place).values({ name: "Lisbon" }).returning().get();
  await db.update(schema.day).set({ overnightPlaceId: place.id }).where(eq(schema.day.id, world.ours.dayId));
  return place.id;
}

describe("the upload door", () => {
  it("refuses no token, a bad token and a bad trip id", async () => {
    expect((await post(null)).status).toBe(401);
    expect((await post("1.bad.token")).status).toBe(401);
    const request = new Request("http://floc.test/api/media/x", { method: "POST", headers: { "x-floc-media-token": uploadToken() }, body: "x" });
    expect((await POST(request, postParams("x"))).status).toBe(401);
  });

  it("refuses someone who has left the trip, even with a live token", async () => {
    expect((await post(uploadToken(world.outsider))).status).toBe(404);
  });

  it("refuses an empty request", async () => {
    expect((await post(uploadToken(), "", null)).status).toBe(400);
  });

  it("saves a photo on the stop it names", async () => {
    const placeId = await stopOnTrip();
    const response = await post(uploadToken(), `?place=${placeId}`);
    expect(response.status).toBe(201);
    expect((await listMedia(trip()))[0].placeId).toBe(placeId);
  });

  it("reports a refusal in words", async () => {
    const response = await post(uploadToken(), "", new TextEncoder().encode("not a picture"), "image/gif");
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "Add a JPEG, PNG or WebP photo, or an MP4, MOV or WebM video." });
  });

  it("takes a video's shape from the query, and ignores nonsense", async () => {
    await givePro(world.member);
    const response = await post(uploadToken(), "?w=1920&h=1080&d=abc", mp4(), "video/mp4");
    expect(response.status).toBe(201);
    expect((await listMedia(trip()))[0]).toMatchObject({ width: 1920, height: 1080, durationSeconds: null });
  });
});

describe("the viewing door", () => {
  it("serves a member the photo and its smaller thumbnail, privately", async () => {
    const id = await savedPhoto();
    const full = await get(id);
    const thumb = await get(id, "?size=thumb");
    expect(full.status).toBe(200);
    expect(full.headers.get("content-type")).toBe("image/webp");
    expect(full.headers.get("cache-control")).toContain("private");
    expect(full.headers.get("content-security-policy")).toContain("sandbox");
    expect(Number(thumb.headers.get("content-length"))).toBeLessThanOrEqual(Number(full.headers.get("content-length")));
    await full.body?.cancel();
    await thumb.body?.cancel();
  });

  it("serves a member's phone through a view token", async () => {
    const id = await savedPhoto();
    signIn(null);
    const response = await get(id, `?t=${mintMediaToken("view", world.member, trip())}`);
    expect(response.status).toBe(200);
    await response.body?.cancel();
  });

  it("hides it from an outsider, with or without a token", async () => {
    const id = await savedPhoto();
    await expectNotFound(() => get(id, `?t=${mintMediaToken("view", world.outsider, trip())}`));
    await expectNotFound(() => get(id, "?t=forged"));
    signIn(world.outsider);
    await expectNotFound(() => get(id));
  });

  it("is not found for a bad id, a deleted picture or a lost file", async () => {
    const id = await savedPhoto();
    await expectNotFound(() => GET(new Request("http://floc.test/x"), getParams("x")));
    const row = await liveMedia(trip(), id);
    await rm(mediaPath(row!.storageKey)!);
    await expectNotFound(() => get(id));
    await deleteMedia(trip(), id);
    await expectNotFound(() => get(id));
  });

  it("serves a video in ranges so it can seek", async () => {
    const id = await savedVideo();
    const part = await get(id, "", { range: "bytes=4-11" });
    expect(part.status).toBe(206);
    expect(part.headers.get("content-range")).toBe(`bytes 4-11/${mp4().byteLength}`);
    expect(Buffer.from(await part.arrayBuffer()).toString()).toBe("ftypisom");
  });

  it("refuses a range past the end", async () => {
    const id = await savedVideo();
    const response = await get(id, "", { range: "bytes=9999-" });
    expect(response.status).toBe(416);
  });
});

describe("byte ranges", () => {
  it.each([
    ["bytes=0-9", { start: 0, end: 9 }],
    ["bytes=5-", { start: 5, end: 99 }],
    ["bytes=-10", { start: 90, end: 99 }],
    ["bytes=90-500", { start: 90, end: 99 }],
  ])("reads %s", (header, range) => {
    expect(parseRange(header, 100)).toEqual(range);
  });

  it("has no range without a header, and refuses a malformed one", () => {
    expect(parseRange(null, 100)).toBeNull();
    expect(parseRange("bytes=-", 100)).toBe("invalid");
    expect(parseRange("items=1-2", 100)).toBe("invalid");
    expect(parseRange("bytes=9-3", 100)).toBe("invalid");
  });

  it("knows no size for a key outside the media folder", async () => {
    expect(await fileSize("../secret")).toBeNull();
    expect(mediaPath("../secret")).toBeNull();
  });
});

describe("the web's actions", () => {
  it("mints an upload token for the signed-in member", async () => {
    const response = await post(await mediaUploadToken(trip()));
    expect(response.status).toBe(201);
  });

  it("refuses an outsider a token", async () => {
    signIn(world.outsider);
    await expectNotFound(() => mediaUploadToken(trip()));
  });

  it("deletes the member's own picture", async () => {
    const id = await savedPhoto();
    await deleteMedia(trip(), id);
    expect(await listMedia(trip())).toEqual([]);
  });
});

describe("what the Overview shows", () => {
  const view = async (who = world.member, stops: { placeId: number; no: number; name: string }[] = []) =>
    readMediaView((await findTripAccess(trip(), who))!, stops);

  it("groups by stop and says whose each picture is", async () => {
    const placeId = await stopOnTrip();
    await post(uploadToken(), `?place=${placeId}`);
    const seen = await view(world.admin, [{ placeId, no: 1, name: "Lisbon" }]);
    expect(seen.groups[0].items[0]).toMatchObject({ kind: "photo", who: "Mo", mine: false, clock: null });
    expect(seen.groups[0].items[0].thumb).toContain("size=thumb");
    expect(seen.capLine).toBe("1 of 100 photos");
    expect(seen.canAdd).toBe(true);
  });

  it("shows a video's length, Pro's limit and your own mark", async () => {
    await savedVideo();
    const seen = await view();
    expect(seen.groups.at(-1)?.items[0]).toMatchObject({ kind: "video", clock: "1:12", mine: true });
    expect(seen.capLine).toBe("0 of 1,000 photos");
  });

  it("names someone no longer on the trip as a former member", async () => {
    await savedPhoto();
    await db.delete(schema.tripMembership).where(eq(schema.tripMembership.userId, world.member));
    expect((await view(world.admin)).groups.at(-1)?.items[0].who).toBe("Former member");
  });

  it("stops adding on an archived trip", async () => {
    await db.update(schema.trip).set({ archivedAt: new Date() }).where(eq(schema.trip.id, trip()));
    expect((await view()).canAdd).toBe(false);
  });
});

describe("what the phone reads", () => {
  it("lists pictures with links it can open, and a token to upload", async () => {
    await savedPhoto();
    const list = await webPort.listTripMedia(world.member, trip());
    expect(list.canAdd).toBe(true);
    expect(list.uploadUrl).toBe(`/api/media/${trip()}`);
    expect(list.items[0]).toMatchObject({ kind: "photo", uploaderName: "Mo", mine: true });
    expect(list.items[0].thumbUrl).toContain("size=thumb&t=");
  });

  it("names a former member, and hides the list from an outsider", async () => {
    await savedPhoto();
    await db.delete(schema.tripMembership).where(eq(schema.tripMembership.userId, world.member));
    expect((await webPort.listTripMedia(world.admin, trip())).items[0]).toMatchObject({ uploaderName: "Former member", mine: false });
    await expect(webPort.listTripMedia(world.outsider, trip())).rejects.toThrow("No such trip.");
  });

  it("deletes the member's own picture", async () => {
    const id = await savedPhoto();
    await webPort.deleteTripMedia(world.member, trip(), id);
    expect((await webPort.listTripMedia(world.member, trip())).items).toEqual([]);
  });
});
