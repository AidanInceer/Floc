/**
 * Scenario A — the ordinary case (#no-ticket).
 *
 * Four people who all know each other, one trip five weeks out, a bag that is
 * part claimed and part still open, three expenses that leave a real balance.
 * Nothing pending, nothing broken: this is what "working" looks like, and the
 * baseline you compare B against.
 */
import { db } from "../index.ts";
import { availability, day, dayEvent, place } from "../schema.ts";
import type { Person } from "./people.ts";
import { seedNotesPages } from "./notes-pages.ts";
import { FRIENDS_ONLY, OPEN, PRIVATE } from "./profiles.ts";
import { befriend, ensureDevUser, seedPerson } from "./people.ts";
import {
  addExpense,
  addPackingLine,
  addPersonalPackingLine,
  isoIn,
  makeTrip,
} from "./world.ts";

// All three are your friends, so from your seat only Sofia's private switch
// shows. Sign in as each other to see the rings from inside.
const PEOPLE: Person[] = [
  {
    handle: "priya",
    name: "Priya Raman",
    profile: {
      vibes: ["museums", "beaches", "food first"],
      currency: "GBP",
      rings: OPEN,
      diet: { flags: ["vegetarian"], shared: true },
      map: { green: ["IT", "GR", "PT"], yellow: ["JP", "PE"] },
    },
  },
  {
    handle: "tom",
    name: "Tom Whitfield",
    profile: {
      vibes: ["hiking", "road trips", "early starts"],
      currency: "EUR",
      rings: FRIENDS_ONLY,
      diet: { flags: ["no-alcohol"], shared: false },
      map: { green: ["NO", "IS"] },
    },
  },
  {
    handle: "sofia",
    name: "Sofia Alves",
    profile: {
      vibes: ["beaches", "late nights", "festivals"],
      currency: "EUR",
      rings: PRIVATE,
      map: { green: ["BR"] },
    },
  },
];

export async function buildScenarioA(): Promise<string> {
  const you = await ensureDevUser();
  const [priya, tom, sofia] = await Promise.all(
    PEOPLE.map((p) => seedPerson(p, "a")),
  );

  const roster = [you, priya, tom, sofia];
  for (let i = 0; i < roster.length; i++) {
    for (let j = i + 1; j < roster.length; j++) await befriend(roster[i], roster[j]);
  }

  const tripId = await makeTrip({
    name: "Portugal, late summer",
    startDate: isoIn(38),
    endDate: isoIn(45),
    createdBy: priya,
    tags: ["the usual four"],
    members: [
      { userId: priya, role: "admin" },
      { userId: you, role: "admin" },
      { userId: tom, role: "member" },
      { userId: sofia, role: "member" },
    ],
  });

  // Tom can't make the first two days — a real gap for the calendar to draw.
  for (const [i, userId] of [you, priya, tom].entries()) {
    await db.insert(availability).values(
      [0, 1, 2, 3, 4, 5, 6, 7].map((offset) => ({
        tripId,
        userId,
        date: isoIn(38 + offset),
        available: !(i === 2 && offset < 2),
      })),
    );
  }

  const days = await planPortugal(tripId);
  await packPortugal(tripId, { you, priya, tom, sofia });
  await spendPortugal(tripId, days, { you, priya, tom, roster });
  await seedNotesPages(tripId, { you, priya, tom, sofia });

  return `Portugal, late summer — trip ${tripId}, 4 members, 5 shared packing lines, 3 expenses.`;
}

async function planPortugal(tripId: number): Promise<{ id: number }[]> {
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

  // Three nights Lisbon then four in Lagos — "stops" are derived, never stored.
  const days = await db
    .insert(day)
    .values(
      [0, 1, 2, 3, 4, 5, 6, 7].map((offset) => ({
        tripId,
        date: isoIn(38 + offset),
        overnightPlaceId: offset < 3 ? lisbon.id : lagos.id,
      })),
    )
    .returning({ id: day.id });

  await db.insert(dayEvent).values([
    {
      dayId: days[0].id,
      orderIndex: 0,
      type: "transport",
      transportType: "flight",
      title: "Flight to Lisbon",
      time: "10:15",
      endTime: "12:45",
      note: "Birmingham to Lisbon. Priya is on the same flight.",
      placeId: lisbon.id,
    },
    {
      dayId: days[0].id,
      orderIndex: 1,
      type: "food",
      title: "Dinner in Alfama",
      time: "19:30",
      note: "Nothing booked — whoever gets there first grabs a table.",
      placeId: lisbon.id,
    },
    {
      dayId: days[1].id,
      orderIndex: 0,
      type: "activity",
      title: "Tram 28",
      time: "08:30",
      endTime: "10:00",
      note: "Early, before the queues.",
      placeId: lisbon.id,
    },
    {
      dayId: days[3].id,
      orderIndex: 0,
      type: "transport",
      transportType: "train",
      title: "Train to Lagos",
      time: "09:05",
      endTime: "13:10",
      note: "Lisbon Oriente to Lagos, about four hours.",
      placeId: lagos.id,
    },
  ]);

  return days;
}

async function packPortugal(
  tripId: number,
  { you, priya, tom, sofia }: Record<"you" | "priya" | "tom" | "sofia", string>,
): Promise<void> {
  // One of each packing state, so every badge has something to render.
  await addPackingLine({
    tripId,
    createdBy: priya,
    label: "Beach towels",
    category: "accessories",
    quantity: 4,
    claims: [{ userId: sofia, packed: true }],
  });
  await addPackingLine({
    tripId,
    createdBy: priya,
    label: "Bluetooth speaker",
    category: "other",
    claims: [{ userId: tom, packed: false }],
  });
  await addPackingLine({
    tripId,
    createdBy: tom,
    label: "Suncream",
    category: "toiletries",
    quantity: 2,
    claims: [
      { userId: tom, packed: true },
      { userId: you, packed: false },
    ],
  });
  await addPackingLine({
    tripId,
    createdBy: sofia,
    label: "Travel adapters",
    category: "essentials",
    quantity: 3,
  });
  await addPackingLine({
    tripId,
    createdBy: you,
    label: "Cool bag",
    category: "other",
    claims: [{ userId: you, packed: false }],
  });

  await addPersonalPackingLine({
    tripId,
    ownerId: you,
    label: "Passport",
    category: "essentials",
    packed: true,
  });
  await addPersonalPackingLine({
    tripId,
    ownerId: you,
    label: "Swim shorts",
    category: "clothes",
  });
}

async function spendPortugal(
  tripId: number,
  days: { id: number }[],
  { you, priya, tom, roster }: { you: string; priya: string; tom: string; roster: string[] },
): Promise<void> {
  await addExpense({
    tripId,
    dayId: days[0].id,
    paidBy: priya,
    description: "Airbnb, three nights in Lisbon",
    amountMinor: 48000,
    currency: "GBP",
    splitType: "shares",
    participants: roster,
    weights: roster.map(() => 1),
  });
  await addExpense({
    tripId,
    dayId: days[3].id,
    paidBy: tom,
    description: "Train tickets, Lisbon to Lagos",
    amountMinor: 12400,
    currency: "EUR",
    splitType: "shares",
    participants: roster,
    weights: roster.map(() => 1),
  });
  await addExpense({
    tripId,
    dayId: days[0].id,
    paidBy: you,
    description: "Dinner in Alfama (Sofia had the tasting menu)",
    amountMinor: 16350,
    currency: "EUR",
    splitType: "shares",
    participants: roster,
    weights: [1, 1, 1, 2],
  });
}
