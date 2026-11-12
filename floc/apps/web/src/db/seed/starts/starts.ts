/**
 * Why: some moments only happen once or only between people — a first trip, a guest link,
 * being removed — so the dev account can never see them again. Each start puts the seeded
 * database into the moment just before one, and says who to be and where to land.
 */
import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { db } from "../../index.ts";
import { availability, idea, ideaVote, trip, tripMembership } from "../../schema.ts";
import { SEED_DOMAIN } from "../identity.ts";
import { seedGuest, upsertAccount } from "../people.ts";
import { OPEN } from "../profiles.ts";
import { isoIn, makeTrip } from "../world.ts";
import { mintShareToken } from "@/server/trips/invite-link";

export const STARTS = ["new-user", "walkthrough", "join-link", "guest-account", "dead-link", "map-question"] as const;
export type StartName = (typeof STARTS)[number];

/** `as` is a user id, or null to land signed out. */
export type Start = { as: string | null; to: string };

const startEmail = (handle: string) => `${handle}@start.${SEED_DOMAIN}`;

async function tripNamed(name: string) {
  const row = await db.select().from(trip).where(eq(trip.name, name)).get();
  if (!row) throw new Error(`"${name}" is missing — run the A and B seeds first.`);
  return row;
}

async function walkthrough(): Promise<Start> {
  const newcomer = await upsertAccount({
    id: "seed-start-newcomer",
    email: startEmail("newcomer"),
    password: "seed-password",
    name: "Alex Newman",
    profile: { vibes: [], currency: "GBP", rings: OPEN },
  });
  const tripId = await makeTrip({
    name: "Lisbon, long weekend",
    startDate: isoIn(60),
    endDate: isoIn(63),
    createdBy: newcomer,
    members: [{ userId: newcomer, role: "admin" }],
  });
  return { as: newcomer, to: `/trip/${tripId}/overview` };
}

/** Portugal has no ideas in seed A; a link page with nothing to vote on tests nothing. */
async function portugalWithIdeas() {
  const portugal = await tripNamed("Portugal, late summer");
  const ideas = await db
    .insert(idea)
    .values([
      { tripId: portugal.id, createdBy: "seed-a-priya", title: "Day trip to Sintra" },
      { tripId: portugal.id, createdBy: "seed-a-tom", title: "Sunset at Senhora do Monte" },
      { tripId: portugal.id, createdBy: "seed-a-sofia", title: "Pastel de nata crawl" },
    ])
    .returning({ id: idea.id });
  await db.insert(ideaVote).values({ ideaId: ideas[0].id, userId: "seed-a-priya" });
  return { portugal, ideas };
}

async function joinLink(): Promise<Start> {
  const { portugal } = await portugalWithIdeas();
  return { as: null, to: `/invite/${mintShareToken(portugal.inviteToken)}` };
}

async function guestAccount(): Promise<Start> {
  const { portugal, ideas } = await portugalWithIdeas();
  const sam = await seedGuest({ id: "seed-start-sam", email: startEmail("sam"), name: "Sam" });
  await db.insert(ideaVote).values([ideas[0], ideas[2]].map((i) => ({ ideaId: i.id, userId: sam })));
  await db
    .insert(availability)
    .values([38, 39, 40].map((d) => ({ tripId: portugal.id, userId: sam, date: isoIn(d), available: true })));
  return { as: sam, to: `/invite/${mintShareToken(portugal.inviteToken)}` };
}

async function deadLink(): Promise<Start> {
  const portugal = await tripNamed("Portugal, late summer");
  await db.update(trip).set({ inviteToken: randomUUID() }).where(eq(trip.id, portugal.id));
  return { as: null, to: `/invite/${mintShareToken(portugal.inviteToken)}` };
}

async function mapQuestion(): Promise<Start> {
  const krakow = await tripNamed("Krakow, last winter");
  const on = (userId: string) => and(eq(tripMembership.tripId, krakow.id), eq(tripMembership.userId, userId));
  await db.update(tripMembership).set({ role: "admin" }).where(on("seed-b-mei"));
  await db
    .update(tripMembership)
    .set({ deletedAt: new Date(), mapPromptAt: new Date() })
    .where(on("dev-user"));
  return { as: "dev-user", to: "/profile" };
}

const BUILDERS: Record<StartName, () => Promise<Start>> = {
  "new-user": async () => ({ as: null, to: "/signup" }),
  walkthrough,
  "join-link": joinLink,
  "guest-account": guestAccount,
  "dead-link": deadLink,
  "map-question": mapQuestion,
};

/** Assumes seeds A and B are in; `index.ts` wipes and seeds first. */
export function buildStart(name: StartName): Promise<Start> {
  return BUILDERS[name]();
}

export function isStartName(name: string): name is StartName {
  return (STARTS as readonly string[]).includes(name);
}

/** The dev link that signs you in as `as` (or out) and lands you on `to`. */
export function enterPath(start: Start): string {
  const query = new URLSearchParams({ to: start.to, ...(start.as ? { as: start.as } : {}) });
  return `/api/dev/enter?${query}`;
}
