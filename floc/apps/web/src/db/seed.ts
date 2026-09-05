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
  friendship,
  note,
  place,
  subscription,
  trip,
  tripMembership,
  user,
  userProfile,
} from "./schema.ts";
import type { WritableSplitType } from "@floc/core/money";
import { computeSplits } from "@floc/core/money";

const PEOPLE = [
  {
    name: "Aidan Inceer",
    email: "aidan@example.com",
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

/** On nobody's trip, only somebody's friend (ticket 145) — gives friends-of-friends discovery something past the roster. */
const FRIENDS_OF_FRIENDS = [
  {
    name: "Nadia Haddad",
    email: "nadia@example.com",
    vibes: ["hiking", "wild swimming", "slow travel"],
    currency: "EUR" as const,
    friendOf: 1, // index into PEOPLE
  },
  {
    name: "Callum Reid",
    email: "callum@example.com",
    vibes: ["road trips", "budget", "live music"],
    currency: "GBP" as const,
    friendOf: 2,
  },
  {
    name: "Mei Tanaka",
    email: "mei@example.com",
    vibes: ["museums and galleries", "city breaks", "food and markets"],
    currency: "GBP" as const,
    friendOf: 3,
  },
  {
    name: "Jonas Berg",
    email: "jonas@example.com",
    vibes: ["skiing and snow", "worth splashing out", "late nights"],
    currency: "EUR" as const,
    friendOf: 1,
  },
];

// Deliberately open — a private-by-default seed makes discovery surfaces look broken.
const PUBLIC_RINGS = {
  isPrivate: false,
  visibilityPicture: "trip_members",
  visibilityVibeTags: "trip_members",
  visibilityTravelMap: "trip_members",
  visibilityFriends: "trip_members",
  pastTripsShow: "all",
} as const;

// Upserts the profile rather than skipping — otherwise re-seeding never rolls a new column forward.
async function upsertPerson(person: {
  name: string;
  email: string;
  vibes: string[];
  currency: (typeof PEOPLE)[number]["currency"];
}): Promise<string> {
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

  const fields = {
    displayName: person.name,
    homeCurrency: person.currency,
    vibeTags: person.vibes,
    signupChannel: "direct" as const,
    ...PUBLIC_RINGS,
  };

  await db
    .insert(userProfile)
    .values({ userId: id, ...fields })
    .onConflictDoUpdate({ target: userProfile.userId, set: fields });

  return id;
}

// Canonical lower-id-first direction.
async function makeFriends(a: string, b: string): Promise<void> {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  await db
    .insert(friendship)
    .values({ userId: lo, friendId: hi, status: "accepted", origin: "request" })
    .onConflictDoUpdate({
      target: [friendship.userId, friendship.friendId],
      set: { status: "accepted", deletedAt: null },
    });
}

async function main() {
  const userIds: string[] = [];
  for (const person of PEOPLE) userIds.push(await upsertPerson(person));

  const [aidan, priya, tom, sofia] = userIds;

  /**
   * Pro on a wiped database (ticket 246). A comped row, exactly the shape a
   * tester gets by hand in Drizzle Studio — no dev-only bypass, so local
   * development runs the same gate production does. Null period end = forever.
   */
  await db
    .insert(subscription)
    .values({ userId: aidan, status: "active", source: "comp" });

  // All four travellers know each other.
  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      await makeFriends(userIds[i], userIds[j]);
    }
  }

  // …and each knows somebody the others don't (ticket 145).
  for (const person of FRIENDS_OF_FRIENDS) {
    const id = await upsertPerson(person);
    await makeFriends(userIds[person.friendOf], id);
  }

  // Relative to today so the trip is always upcoming.
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
    })
    .returning({ id: trip.id });

  const tripId = created.id;

  await db.insert(tripMembership).values([
    { tripId, userId: aidan, role: "admin" },
    { tripId, userId: priya, role: "admin" },
    { tripId, userId: tom, role: "member" },
    { tripId, userId: sofia, role: "member" },
  ]);

  for (const [i, userId] of [aidan, priya, tom].entries()) {
    await db.insert(availability).values(
      [0, 1, 2, 3, 4, 5, 6, 7].map((offset) => ({
        tripId,
        userId,
        date: isoIn(38 + offset),
        // Tom can't make the first two days — a real gap to render.
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

  // Three nights Lisbon then four in Lagos — derived "stops", never stored.
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

  await db.insert(note).values([
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
    // `even` is schema-legacy; one share each since ticket 85 (ticket 117, S12).
    splitType: "shares",
    participants: members,
    weights: members.map(() => 1),
  });

  await addExpense({
    tripId,
    dayId: dayRows[3].id,
    createdBy: tom,
    paidBy: tom,
    description: "Train tickets, Lisbon → Lagos",
    amountMinor: 12400,
    currency: "EUR",
    // `even` is schema-legacy; one share each since ticket 85 (ticket 117, S12).
    splitType: "shares",
    participants: members,
    weights: members.map(() => 1),
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
  splitType: WritableSplitType;
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
