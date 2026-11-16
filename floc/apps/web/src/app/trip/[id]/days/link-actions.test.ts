import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db, schema } from "@/db";
import { migrateTestDb, resetDb, seedScenario, signIn, type Scenario } from "@/test/db";
import { labelFor, readWebUrl } from "@/server/trips/trip-links";
import { addTripLink, removeTripLink } from "./link-actions";

let world: Scenario;

beforeAll(migrateTestDb);

beforeEach(async () => {
  await resetDb();
  world = await seedScenario();
  signIn(world.member);
});

const linksOf = async (tripId: number) =>
  db
    .select({ id: schema.tripLink.id, url: schema.tripLink.url, label: schema.tripLink.label })
    .from(schema.tripLink)
    .where(eq(schema.tripLink.tripId, tripId))
    .all();

const form = (url: string, label = "") => {
  const data = new FormData();
  data.set("url", url);
  data.set("label", label);
  return data;
};

describe("readWebUrl", () => {
  it("keeps a plain https address", () => {
    expect(readWebUrl("https://example.com/villa")).toBe("https://example.com/villa");
  });

  it("assumes https for the bare host people actually paste", () => {
    expect(readWebUrl("booking.com/lisbon")).toBe("https://booking.com/lisbon");
  });

  it("refuses a scheme that isn't the web", () => {
    expect(readWebUrl("javascript:alert(1)")).toBeNull();
    expect(readWebUrl("data:text/html,<script>")).toBeNull();
    expect(readWebUrl("file:///etc/passwd")).toBeNull();
  });

  it("refuses nothing at all", () => {
    expect(readWebUrl("")).toBeNull();
    expect(readWebUrl("   ")).toBeNull();
    expect(readWebUrl(null)).toBeNull();
  });
});

describe("labelFor", () => {
  it("prefers what somebody typed", () => {
    expect(labelFor("https://www.cp.pt/times", "Train times")).toBe("Train times");
  });

  it("falls back to the host, without the www", () => {
    expect(labelFor("https://www.cp.pt/times", null)).toBe("cp.pt");
  });
});

describe("the link shelf", () => {
  it("a member can park a link on their own trip", async () => {
    await addTripLink(world.ours.id, form("https://example.com/villa", "The villa"));

    expect(await linksOf(world.ours.id)).toEqual([
      { id: expect.any(Number), url: "https://example.com/villa", label: "The villa" },
    ]);
  });

  it("drops a link that isn't a web address rather than storing it", async () => {
    await addTripLink(world.ours.id, form("javascript:alert(1)"));

    expect(await linksOf(world.ours.id)).toHaveLength(0);
  });

  it("cannot be added to a trip you're not on", async () => {
    signIn(world.outsider);
    await expect(
      addTripLink(world.ours.id, form("https://example.com/villa")),
    ).rejects.toThrow();

    expect(await linksOf(world.ours.id)).toHaveLength(0);
  });

  it("cannot be removed from another trip by id", async () => {
    await addTripLink(world.ours.id, form("https://example.com/villa"));
    const [link] = await linksOf(world.ours.id);

    signIn(world.outsider);
    await removeTripLink(world.theirs.id, link.id);

    expect(await linksOf(world.ours.id)).toHaveLength(1);
  });

  it("can be removed by the person who added it", async () => {
    await addTripLink(world.ours.id, form("https://example.com/villa"));
    const [link] = await linksOf(world.ours.id);

    await removeTripLink(world.ours.id, link.id);

    const rows = await db
      .select({ deletedAt: schema.tripLink.deletedAt })
      .from(schema.tripLink)
      .where(eq(schema.tripLink.id, link.id))
      .all();
    expect(rows[0].deletedAt).not.toBeNull();
  });
});
