/**
 * Scenario B — the messy case (#no-ticket).
 *
 * Everything A leaves out: a bigger roster than a phone screen wants, an
 * invite you have not answered, a friend request waiting on you, a past trip
 * behind the upcoming one, three currencies, and a bag nobody has finished.
 * The states that only appear once a group has been going a while.
 */
import { db } from "../index.ts";
import { availability, day, dayEvent, note, place, tripInvite } from "../schema.ts";
import type { Person } from "./people.ts";
import { FRIENDS_ONLY, MIXED, OPEN, PRIVATE } from "./profiles.ts";
import { befriend, ensureDevUser, requestFriendship, seedPerson } from "./people.ts";
import {
  addExpense,
  addPackingLine,
  addPersonalPackingLine,
  isoIn,
  makeTrip,
} from "./world.ts";

const PEOPLE: Person[] = [
  {
    handle: "nadia",
    name: "Nadia Haddad",
    profile: {
      vibes: ["hiking", "early starts", "slow mornings"],
      currency: "EUR",
      rings: OPEN,
      diet: { flags: ["pescatarian"], notes: "Allergic to walnuts.", shared: true },
      map: { green: ["MA", "CH", "AT"], yellow: ["NP"] },
    },
  },
  {
    handle: "callum",
    name: "Callum Reid",
    profile: {
      vibes: ["road trips", "festivals"],
      currency: "GBP",
      rings: MIXED,
      map: { green: ["IE", "DE", "PL"] },
    },
  },
  {
    handle: "mei",
    name: "Mei Tanaka",
    profile: {
      vibes: ["city breaks", "food first", "museums"],
      currency: "GBP",
      rings: OPEN,
      diet: { flags: ["vegan"], shared: true },
      map: { green: ["JP", "KR", "TW"], yellow: ["VN"] },
    },
  },
  {
    handle: "jonas",
    name: "Jonas Berg",
    profile: {
      vibes: ["late nights"],
      currency: "EUR",
      rings: PRIVATE,
      map: { green: ["SE", "NO"] },
    },
  },
  // On your trip but not your friend — friends-only rings hide from you here.
  {
    handle: "ruth",
    name: "Ruth Okonkwo",
    profile: {
      vibes: ["museums", "slow mornings"],
      currency: "USD",
      rings: FRIENDS_ONLY,
      map: { green: ["US", "CA"], yellow: ["GB"] },
    },
  },
  // On nobody's trip, and not yet a friend — a stranger, so no profile at all.
  {
    handle: "elliot",
    name: "Elliot Vance",
    profile: {
      vibes: ["slow mornings", "festivals"],
      currency: "GBP",
      rings: OPEN,
      map: { green: ["ES"] },
    },
  },
];

export async function buildScenarioB(): Promise<string> {
  const you = await ensureDevUser();
  const [nadia, callum, mei, jonas, ruth, elliot] = await Promise.all(
    PEOPLE.map((p) => seedPerson(p, "b")),
  );

  const crew = [nadia, callum, mei, jonas, ruth];
  for (const person of [nadia, callum, mei, jonas]) await befriend(you, person);
  for (let i = 0; i < crew.length; i++) {
    for (let j = i + 1; j < crew.length; j++) await befriend(crew[i], crew[j]);
  }
  await requestFriendship(elliot, you);

  const dolomites = await buildDolomites(you, crew);
  const tokyo = await buildTokyoInvite(you, [nadia, mei, jonas, ruth]);
  const krakow = await buildPastTrip(you, [callum, mei]);

  return [
    `The Dolomites, February — trip ${dolomites}, 6 members, half-packed bag, 3 currencies.`,
    `Tokyo, cherry blossom — trip ${tokyo}, invite waiting on you (you are not a member).`,
    `Krakow, last winter — trip ${krakow}, already finished.`,
    "Elliot Vance has sent you a friend request.",
    "Profiles: Nadia and Mei open, Callum mixed, Jonas private, Ruth friends-only and not your friend.",
  ].join("\n  ");
}

async function buildDolomites(you: string, crew: string[]): Promise<number> {
  const [nadia, callum, mei, jonas, ruth] = crew;
  const roster = [you, ...crew];

  const tripId = await makeTrip({
    name: "The Dolomites, February",
    startDate: isoIn(96),
    endDate: isoIn(103),
    createdBy: nadia,
    tags: ["ski", "too many people"],
    members: [
      { userId: nadia, role: "admin" },
      { userId: you, role: "member" },
      { userId: callum, role: "member" },
      { userId: mei, role: "member" },
      { userId: jonas, role: "admin" },
      { userId: ruth, role: "member" },
    ],
  });

  // Only half the roster has answered — the state the calendar is actually for.
  for (const userId of [you, nadia, jonas]) {
    await db.insert(availability).values(
      [0, 1, 2, 3, 4, 5, 6, 7].map((offset) => ({
        tripId,
        userId,
        date: isoIn(96 + offset),
        available: !(userId === jonas && offset > 5),
      })),
    );
  }

  const days = await planDolomites(tripId, { mei, callum });
  await packDolomites(tripId, you, crew);
  await spendDolomites(tripId, days, roster);

  return tripId;
}

async function planDolomites(
  tripId: number,
  { mei, callum }: { mei: string; callum: string },
): Promise<{ id: number }[]> {
  const [cortina] = await db
    .insert(place)
    .values({
      providerId: "osm:relation:44924",
      name: "Cortina d'Ampezzo, Italy",
      lat: 46.5405,
      lng: 12.1357,
    })
    .returning({ id: place.id });

  const days = await db
    .insert(day)
    .values(
      [0, 1, 2, 3, 4, 5, 6, 7].map((offset) => ({
        tripId,
        date: isoIn(96 + offset),
        overnightPlaceId: cortina.id,
      })),
    )
    .returning({ id: day.id });

  const events = await db
    .insert(dayEvent)
    .values([
      {
        dayId: days[0].id,
        orderIndex: 0,
        type: "transport",
        transportType: "flight",
        title: "Flight to Venice",
        time: "06:40",
        endTime: "09:55",
        placeId: cortina.id,
      },
      {
        dayId: days[0].id,
        orderIndex: 1,
        type: "transport",
        transportType: "car",
        title: "Cortina Express coach",
        time: "11:30",
        endTime: "13:40",
        note: "Six of us — book the whole row or we are split up.",
        placeId: cortina.id,
      },
      {
        dayId: days[1].id,
        orderIndex: 0,
        type: "activity",
        title: "Lift passes and boot fitting",
        time: "08:00",
        placeId: cortina.id,
      },
      {
        dayId: days[4].id,
        orderIndex: 0,
        type: "food",
        title: "Rifugio lunch, Cinque Torri",
        time: "12:30",
        placeId: cortina.id,
      },
    ])
    .returning({ id: dayEvent.id });

  await db.insert(note).values([
    {
      tripId,
      createdBy: mei,
      scope: "day_event",
      scopeId: events[1].id,
      body: "Ruth lands an hour later — can we hold the bus or does she taxi up?",
    },
    {
      tripId,
      createdBy: callum,
      scope: "trip",
      scopeId: tripId,
      body: "Reminder that I am not paying for anybody's lift pass again.",
    },
  ]);

  return days;
}

async function packDolomites(tripId: number, you: string, crew: string[]): Promise<void> {
  const [nadia, callum, mei, jonas, ruth] = crew;
  const bag: Parameters<typeof addPackingLine>[0][] = [
    {
      tripId,
      createdBy: nadia,
      label: "Snow chains",
      category: "essentials",
      claims: [{ userId: jonas, packed: true }],
    },
    {
      tripId,
      createdBy: nadia,
      label: "First aid kit",
      category: "essentials",
      claims: [{ userId: nadia, packed: false }],
    },
    {
      tripId,
      createdBy: jonas,
      label: "Spare goggles",
      category: "accessories",
      quantity: 2,
      claims: [
        { userId: jonas, packed: true },
        { userId: ruth, packed: false },
      ],
    },
    {
      tripId,
      createdBy: mei,
      label: "Board games",
      category: "other",
      quantity: 3,
      claims: [
        { userId: mei, packed: true },
        { userId: callum, packed: true },
      ],
    },
    { tripId, createdBy: callum, label: "Thermos flasks", category: "other", quantity: 4 },
    { tripId, createdBy: ruth, label: "Hand warmers", category: "accessories", quantity: 12 },
    {
      tripId,
      createdBy: you,
      label: "Speaker and charger",
      category: "other",
      claims: [{ userId: you, packed: false }],
    },
  ];
  for (const line of bag) await addPackingLine(line);

  await addPersonalPackingLine({
    tripId,
    ownerId: you,
    label: "Thermals",
    category: "clothes",
    packed: true,
  });
  await addPersonalPackingLine({ tripId, ownerId: you, label: "Ski socks", category: "clothes" });
  await addPersonalPackingLine({
    tripId,
    ownerId: you,
    label: "Lip balm",
    category: "toiletries",
  });
}

/** `roster` is you first, then the crew in the order `buildDolomites` got them. */
async function spendDolomites(
  tripId: number,
  days: { id: number }[],
  roster: string[],
): Promise<void> {
  const [you, nadia, callum, mei, jonas, ruth] = roster;
  // Three currencies and an uneven split — the settle-up screen's hard case.
  await addExpense({
    tripId,
    dayId: days[0].id,
    paidBy: nadia,
    description: "Chalet, whole week",
    amountMinor: 214000,
    currency: "EUR",
    splitType: "shares",
    participants: roster,
    weights: roster.map(() => 1),
  });
  await addExpense({
    tripId,
    dayId: days[1].id,
    paidBy: jonas,
    description: "Lift passes (Callum is not skiing)",
    amountMinor: 98000,
    currency: "EUR",
    splitType: "shares",
    participants: [you, nadia, mei, jonas, ruth],
    weights: [1, 1, 1, 1, 1],
  });
  await addExpense({
    tripId,
    dayId: null,
    paidBy: you,
    description: "Airport parking and fuel",
    amountMinor: 17600,
    currency: "GBP",
    splitType: "shares",
    participants: [you, callum, mei],
    weights: [1, 1, 1],
  });
  await addExpense({
    tripId,
    dayId: days[4].id,
    paidBy: ruth,
    description: "Rifugio lunch",
    amountMinor: 24500,
    currency: "USD",
    splitType: "shares",
    participants: roster,
    weights: [2, 1, 1, 1, 2, 1],
  });
}

/** A trip you can see the invite for but not the inside of — never a membership row. */
async function buildTokyoInvite(you: string, crew: string[]): Promise<number> {
  const [nadia, mei, jonas, ruth] = crew;

  const tripId = await makeTrip({
    name: "Tokyo, cherry blossom",
    startDate: isoIn(210),
    endDate: isoIn(222),
    createdBy: mei,
    members: [
      { userId: mei, role: "admin" },
      { userId: nadia, role: "member" },
      { userId: jonas, role: "member" },
      { userId: ruth, role: "member" },
    ],
  });

  await db
    .insert(tripInvite)
    .values({ tripId, fromUserId: mei, toUserId: you, status: "pending" });

  return tripId;
}

/** Behind you, so the trips list has to sort and the travel map has a country to fill. */
async function buildPastTrip(you: string, crew: string[]): Promise<number> {
  const [callum, mei] = crew;

  const tripId = await makeTrip({
    name: "Krakow, last winter",
    startDate: isoIn(-120),
    endDate: isoIn(-114),
    createdBy: you,
    members: [
      { userId: you, role: "admin" },
      { userId: callum, role: "member" },
      { userId: mei, role: "member" },
    ],
  });

  const [krakow] = await db
    .insert(place)
    .values({
      providerId: "osm:relation:449696",
      name: "Krakow, Poland",
      lat: 50.0647,
      lng: 19.945,
    })
    .returning({ id: place.id });

  await db.insert(day).values(
    [0, 1, 2, 3, 4, 5, 6].map((offset) => ({
      tripId,
      date: isoIn(-120 + offset),
      overnightPlaceId: krakow.id,
    })),
  );

  await addExpense({
    tripId,
    dayId: null,
    paidBy: callum,
    description: "Apartment, six nights",
    amountMinor: 39000,
    currency: "GBP",
    splitType: "shares",
    participants: [you, callum, mei],
    weights: [1, 1, 1],
  });

  return tripId;
}
