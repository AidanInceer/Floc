/**
 * Development seed: one trip mid-planning, so every tab has something real to
 * render. Run with `pnpm db:seed` after `pnpm db:push`.
 *
 * Deliberately NOT wired to the marketing landing — the map's "seed / demo
 * data" question is still open, and the landing renders a hand-written static
 * sample instead so it needs no database at all.
 *
 * Passwords here are throwaway dev credentials for a local file database.
 */
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "./index.ts";
import {
  availability,
  day,
  dayEvent,
  expense,
  expenseSplit,
  idea,
  ideaVote,
  note,
  place,
  trip,
  tripMembership,
  user,
  userProfile,
} from "./schema.ts";
// Relative, not the `@/` alias: this script runs under Node's own type
// stripping (see the db:seed script), which does no path mapping.
import { computeSplits } from "../lib/money.ts";

const PEOPLE = [
  {
    name: "Aidan Inceer",
    email: "aidan@example.com",
    /** Seed-only, from lib/vibe-tags.ts VIBE_TAGS (ticket 46). */
    vibes: ["food and markets", "city breaks", "slow travel"],
    currency: "GBP" as const,
  },
  {
    name: "Priya Raman",
    email: "priya@example.com",
    vibes: ["museums and galleries", "beaches", "worth splashing out"],
    currency: "GBP" as const,
  },
  {
    name: "Tom Whitfield",
    email: "tom@example.com",
    vibes: ["hiking", "budget", "road trips"],
    currency: "EUR" as const,
  },
  {
    name: "Sofia Alves",
    email: "sofia@example.com",
    vibes: ["beaches", "food and markets", "late nights"],
    currency: "EUR" as const,
  },
];

async function main() {
  const userIds: string[] = [];

  for (const person of PEOPLE) {
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, person.email))
      .get();

    const id = existing?.id ?? randomUUID();
    if (!existing) {
      await db.insert(user).values({
        id,
        name: person.name,
        email: person.email,
        emailVerified: true,
      });
    }
    await db
      .insert(userProfile)
      .values({
        userId: id,
        displayName: person.name,
        homeCurrency: person.currency,
        vibeTags: person.vibes,
        signupChannel: "direct",
      })
      .onConflictDoNothing();
    userIds.push(id);
  }

  const [aidan, priya, tom, sofia] = userIds;

  // Dates chosen relative to today so the trip is always upcoming.
  const start = isoIn(38);
  const end = isoIn(45);

  const [created] = await db
    .insert(trip)
    .values({
      name: "Portugal, late summer",
      startDate: start,
      endDate: end,
      createdBy: aidan,
      inviteToken: randomUUID(),
      // Both tabs are already unlocked because ideas and days exist below.
      routeUnlockedAt: new Date(),
      daysUnlockedAt: new Date(),
    })
    .returning({ id: trip.id });

  const tripId = created.id;

  await db.insert(tripMembership).values([
    { tripId, userId: aidan, role: "admin" },
    { tripId, userId: priya, role: "admin" },
    { tripId, userId: tom, role: "member" },
    { tripId, userId: sofia, role: "member" },
  ]);

  const ideas = await db
    .insert(idea)
    .values([
      {
        tripId,
        createdBy: priya,
        note: "Lisbon for a few nights, then train down to the Algarve",
      },
      {
        tripId,
        createdBy: tom,
        note: "Porto instead — cheaper, and the Douro valley is a day trip",
      },
      {
        tripId,
        createdBy: sofia,
        note: "Skip cities entirely, rent one house near Lagos for the week",
      },
    ])
    .returning({ id: idea.id });

  // Voting is optional and never forced — Sofia has deliberately not voted.
  await db.insert(ideaVote).values([
    { ideaId: ideas[0].id, userId: aidan, value: "up" },
    { ideaId: ideas[0].id, userId: priya, value: "up" },
    { ideaId: ideas[0].id, userId: tom, value: "dont_mind" },
    { ideaId: ideas[1].id, userId: aidan, value: "dont_mind" },
    { ideaId: ideas[1].id, userId: tom, value: "up" },
    { ideaId: ideas[2].id, userId: priya, value: "down" },
  ]);

  for (const [i, userId] of [aidan, priya, tom].entries()) {
    await db.insert(availability).values(
      [0, 1, 2, 3, 4, 5, 6, 7].map((offset) => ({
        tripId,
        userId,
        date: isoIn(38 + offset),
        // Tom can't make the first two days — a real overlap gap to render.
        available: !(i === 2 && offset < 2),
      })),
    );
  }

  const [lisbon] = await db
    .insert(place)
    .values({
      providerId: "osm:relation:5400890",
      name: "Lisbon, Portugal",
      lat: 38.7223,
      lng: -9.1393,
    })
    .returning({ id: place.id });

  const [lagos] = await db
    .insert(place)
    .values({
      providerId: "osm:relation:5978639",
      name: "Lagos, Portugal",
      lat: 37.1028,
      lng: -8.6742,
    })
    .returning({ id: place.id });

  // Three nights Lisbon then four in Lagos — two derived "stops", never stored.
  const dayRows = await db
    .insert(day)
    .values(
      [0, 1, 2, 3, 4, 5, 6, 7].map((offset) => ({
        tripId,
        date: isoIn(38 + offset),
        overnightPlaceId: offset < 3 ? lisbon.id : lagos.id,
      })),
    )
    .returning({ id: day.id, date: day.date });

  const events = await db
    .insert(dayEvent)
    .values([
      {
        dayId: dayRows[0].id,
        orderIndex: 0,
        type: "transport",
        transportType: "flight",
        title: "Flight to Lisbon",
        time: "10:15",
        endTime: "12:45",
        note: "Birmingham → Lisbon. Aidan and Priya are on the same flight.",
        placeId: lisbon.id,
      },
      {
        dayId: dayRows[0].id,
        orderIndex: 1,
        type: "food",
        title: "Dinner in Alfama",
        time: "19:30",
        note: "Nothing booked — whoever gets there first grabs a table.",
        placeId: lisbon.id,
      },
      {
        dayId: dayRows[1].id,
        orderIndex: 0,
        type: "activity",
        title: "Tram 28",
        time: "08:30",
        endTime: "10:00",
        note: "Early, before the queues.",
        placeId: lisbon.id,
      },
      {
        dayId: dayRows[3].id,
        orderIndex: 0,
        type: "transport",
        transportType: "train",
        title: "Train to Lagos",
        time: "09:05",
        endTime: "13:10",
        note: "Lisbon Oriente → Lagos, about four hours.",
        placeId: lagos.id,
      },
    ])
    .returning({ id: dayEvent.id });

  // Threads, so the seeded trip shows what an argument in progress looks like
  // rather than an empty board with vote tallies and nothing said.
  await db.insert(note).values([
    {
      tripId,
      createdBy: tom,
      scope: "idea",
      scopeId: ideas[0].id,
      body: "Trains down to the Algarve are about 4 hours with one change — fine, but it eats a day.",
    },
    {
      tripId,
      createdBy: sofia,
      scope: "idea",
      scopeId: ideas[0].id,
      body: "I'd rather do that than change cities twice. Lisbon first is fine by me.",
    },
    {
      tripId,
      createdBy: priya,
      scope: "idea",
      scopeId: ideas[2].id,
      body: "A house works out cheaper than four hotel rooms, but only if we all actually commit.",
    },
    {
      tripId,
      createdBy: aidan,
      scope: "day_event",
      scopeId: events[1].id,
      body: "Worth booking — Alfama fills up well before eight.",
    },
  ]);

  const members = [aidan, priya, tom, sofia];

  await addExpense({
    tripId,
    dayId: dayRows[0].id,
    createdBy: aidan,
    paidBy: aidan,
    description: "Airbnb, three nights in Lisbon",
    amountMinor: 48000,
    currency: "GBP",
    splitType: "even",
    participants: members,
  });

  await addExpense({
    tripId,
    dayId: dayRows[3].id,
    createdBy: tom,
    paidBy: tom,
    description: "Train tickets, Lisbon → Lagos",
    amountMinor: 12400,
    currency: "EUR",
    splitType: "even",
    participants: members,
  });

  await addExpense({
    tripId,
    dayId: dayRows[0].id,
    createdBy: priya,
    paidBy: priya,
    description: "Dinner in Alfama (Sofia had the tasting menu)",
    amountMinor: 16350,
    currency: "EUR",
    splitType: "shares",
    participants: members,
    weights: [1, 1, 1, 2],
  });

  console.info(
    `Seeded trip ${tripId} ("Portugal, late summer") with ${members.length} members.`,
  );
  console.info(
    "These users have no password — sign up with your own email to poke at it, or add one via Better Auth.",
  );
}

async function addExpense(args: {
  tripId: number;
  dayId: number | null;
  createdBy: string;
  paidBy: string;
  description: string;
  amountMinor: number;
  currency: "GBP" | "EUR" | "USD";
  splitType: "even" | "exact" | "percentage" | "shares";
  participants: string[];
  weights?: number[];
}) {
  const [row] = await db
    .insert(expense)
    .values({
      tripId: args.tripId,
      dayId: args.dayId,
      createdBy: args.createdBy,
      paidBy: args.paidBy,
      description: args.description,
      amountMinor: args.amountMinor,
      currency: args.currency,
      splitType: args.splitType,
    })
    .returning({ id: expense.id });

  const splits = computeSplits(
    args.amountMinor,
    args.splitType,
    args.participants.map((userId, i) => ({
      userId,
      value: args.weights?.[i],
    })),
  );

  await db.insert(expenseSplit).values(
    splits.map((s) => ({
      expenseId: row.id,
      userId: s.userId,
      owedAmountMinor: s.owedAmountMinor,
    })),
  );
}

function isoIn(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
