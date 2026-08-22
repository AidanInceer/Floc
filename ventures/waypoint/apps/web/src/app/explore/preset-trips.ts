// Static listings for the Explore mockup. No partner backend or deal —
// operator names are illustrative placeholders. See docs/partner-trips.html.
// Money is minor units (rule 1); format with `formatMoney`, never by hand.
import type { Currency, TransportType } from "@/db/schema";

/**
 * Ticket 194: a listing is shown by its *shape* — where you sleep and how you
 * move between — rather than by a photograph. `base` nights always sum to
 * `nights`; a `hop` is the move in between and carries no nights of its own.
 */
export type PresetLeg =
  | { kind: "base"; place: string; nights: number }
  | { kind: "hop"; place: string; mode: TransportType; detail: string };

export type PresetTrip = {
  id: string;
  title: string;
  /** Illustrative only — nothing is a partner. */
  operator: string;
  /** True for listings Waypoint would write itself rather than sell space for. */
  editorial?: boolean;
  region: Region;
  country: string;
  nights: number;
  groupSize: string;
  priceFromMinor: number;
  currency: Currency;
  summary: string;
  legs: PresetLeg[];
  highlights: string[];
  bestMonths: string;
  /** Map thumbnail centre — the destination, not the country centroid. */
  lat: number;
  lng: number;
  mapZoom: number;
};

export const REGIONS = [
  "Europe",
  "Africa",
  "Asia",
  "Americas",
  "Oceania",
] as const;

export type Region = (typeof REGIONS)[number];

export const PRESET_TRIPS: PresetTrip[] = [
  {
    id: "amalfi-slow-week",
    title: "Amalfi coast, slowly",
    operator: "Waypoint editorial",
    editorial: true,
    region: "Europe",
    country: "Italy",
    nights: 7,
    groupSize: "4–8 people",
    priceFromMinor: 74000,
    currency: "EUR",
    summary:
      "One base in Praiano, ferries instead of the coast road, and exactly one early start for Pompeii. Built for a group that wants dinner to be the main event.",
    legs: [
      { kind: "base", place: "Praiano", nights: 7 },
      {
        kind: "hop",
        place: "Positano, Amalfi, Capri",
        mode: "ferry",
        detail: "day hops",
      },
    ],
    highlights: [
      "Ferry hop to Positano and Amalfi",
      "Path of the Gods, walked downhill",
      "A day on Capri without the day-trip crowd",
    ],
    bestMonths: "May, June, September",
    lat: 40.612,
    lng: 14.526,
    mapZoom: 9,
  },
  {
    id: "scottish-highlands-bothy",
    title: "Highlands bothy week",
    operator: "Waypoint editorial",
    editorial: true,
    region: "Europe",
    country: "Scotland",
    nights: 5,
    groupSize: "4–6 people",
    priceFromMinor: 32000,
    currency: "GBP",
    summary:
      "A cottage near Torridon, three walking days rated easy to hard, and enough slack that nobody has to summit anything they don't fancy.",
    legs: [
      { kind: "base", place: "Torridon", nights: 5 },
      { kind: "hop", place: "Applecross", mode: "car", detail: "day drive" },
    ],
    highlights: [
      "Beinn Eighe from the Coire Dubh path",
      "Applecross by the Bealach na Bà",
      "A rest day in Plockton",
    ],
    bestMonths: "May, June, September",
    lat: 57.5,
    lng: -4.9,
    mapZoom: 7,
  },
  {
    id: "morocco-atlas-sahara",
    title: "Atlas mountains and Sahara",
    operator: "G Adventures",
    region: "Africa",
    country: "Morocco",
    nights: 8,
    groupSize: "6–12 people",
    priceFromMinor: 89500,
    currency: "GBP",
    summary:
      "Marrakech, two nights in a Berber village in the High Atlas, then camels and a desert camp at Erg Chebbi. Guided throughout, small group.",
    legs: [
      { kind: "base", place: "Marrakech", nights: 3 },
      { kind: "hop", place: "High Atlas", mode: "car", detail: "2h" },
      { kind: "base", place: "Imlil", nights: 2 },
      { kind: "hop", place: "Dades gorge", mode: "car", detail: "5h" },
      { kind: "base", place: "Dades gorge", nights: 2 },
      { kind: "base", place: "Erg Chebbi camp", nights: 1 },
    ],
    highlights: [
      "Imlil valley trek with a local guide",
      "Aït Benhaddou and the Dades gorge",
      "A night under canvas in the dunes",
    ],
    bestMonths: "March to May, October",
    lat: 31.63,
    lng: -7.99,
    mapZoom: 7,
  },
  {
    id: "andalusia-road-trip",
    title: "Andalusian road trip",
    operator: "TUI",
    region: "Europe",
    country: "Spain",
    nights: 6,
    groupSize: "4–8 people",
    priceFromMinor: 58000,
    currency: "EUR",
    summary:
      "Seville, Córdoba, Granada in that order, with a hire car and short driving days. The Alhambra tickets are the only thing you have to book months ahead.",
    legs: [
      { kind: "base", place: "Seville", nights: 2 },
      { kind: "hop", place: "Córdoba", mode: "car", detail: "1h 30" },
      { kind: "base", place: "Córdoba", nights: 1 },
      { kind: "hop", place: "Granada", mode: "car", detail: "2h 15" },
      { kind: "base", place: "Granada", nights: 3 },
    ],
    highlights: [
      "The Alhambra, first entry slot",
      "Mezquita at opening time",
      "Tapas crawl in Triana",
    ],
    bestMonths: "April, May, October",
    lat: 37.3,
    lng: -5.2,
    mapZoom: 7,
  },
  {
    id: "japan-golden-route",
    title: "Japan in ten days",
    operator: "Inside Japan Tours",
    region: "Asia",
    country: "Japan",
    nights: 10,
    groupSize: "2–6 people",
    priceFromMinor: 185000,
    currency: "GBP",
    summary:
      "Tokyo, Hakone, Kyoto and Osaka on a rail pass, with two deliberately empty afternoons so the group can split up and do its own thing.",
    legs: [
      { kind: "base", place: "Tokyo", nights: 4 },
      { kind: "hop", place: "Hakone", mode: "train", detail: "1h 30" },
      { kind: "base", place: "Hakone", nights: 1 },
      { kind: "hop", place: "Kyoto", mode: "train", detail: "2h 20" },
      { kind: "base", place: "Kyoto", nights: 3 },
      { kind: "hop", place: "Osaka", mode: "train", detail: "30 min" },
      { kind: "base", place: "Osaka", nights: 2 },
    ],
    highlights: [
      "Shinkansen to Kyoto",
      "A night in a Hakone ryokan",
      "Nishiki market and Fushimi Inari at dawn",
    ],
    bestMonths: "March to May, October, November",
    lat: 35.36,
    lng: 137.0,
    mapZoom: 6,
  },
  {
    id: "iceland-ring-road",
    title: "Iceland ring road",
    operator: "Intrepid Travel",
    region: "Europe",
    country: "Iceland",
    nights: 7,
    groupSize: "4–8 people",
    priceFromMinor: 142000,
    currency: "GBP",
    summary:
      "The full loop in a week, anticlockwise, with the long driving days front-loaded so the last two are short. Guesthouses booked, car included.",
    legs: [
      { kind: "base", place: "Reykjavík", nights: 1 },
      { kind: "hop", place: "South coast", mode: "car", detail: "3h" },
      { kind: "base", place: "Vík", nights: 1 },
      { kind: "base", place: "Höfn", nights: 2 },
      { kind: "hop", place: "East fjords", mode: "car", detail: "4h" },
      { kind: "base", place: "Mývatn", nights: 2 },
      { kind: "base", place: "Snæfellsnes", nights: 1 },
    ],
    highlights: [
      "Jökulsárlón glacier lagoon",
      "Mývatn and the Diamond Circle",
      "Snæfellsnes on the way back",
    ],
    bestMonths: "June to August",
    lat: 64.9,
    lng: -18.6,
    mapZoom: 7,
  },
  {
    id: "portugal-surf-and-wine",
    title: "Surf and wine, Portugal",
    operator: "Much Better Adventures",
    region: "Europe",
    country: "Portugal",
    nights: 5,
    groupSize: "6–10 people",
    priceFromMinor: 48000,
    currency: "EUR",
    summary:
      "Mornings in the water at Ericeira, afternoons free, and one day out to the Lisbon side for the food. Beginner lessons included for whoever needs them.",
    legs: [
      { kind: "base", place: "Ericeira", nights: 5 },
      {
        kind: "hop",
        place: "Sintra and Lisbon",
        mode: "car",
        detail: "day trip",
      },
    ],
    highlights: [
      "Three coached surf sessions",
      "Sintra day trip",
      "A long lunch in Time Out market",
    ],
    bestMonths: "May to September",
    lat: 38.96,
    lng: -9.42,
    mapZoom: 8,
  },
  {
    id: "patagonia-w-trek",
    title: "Torres del Paine W trek",
    operator: "Exodus Adventure Travels",
    region: "Americas",
    country: "Chile",
    nights: 9,
    groupSize: "6–12 people",
    priceFromMinor: 268000,
    currency: "GBP",
    summary:
      "The classic W over four walking days, refugios booked, with Puerto Natales either side. Serious walking — everyone needs to be honest about fitness first.",
    legs: [
      { kind: "base", place: "Puerto Natales", nights: 2 },
      { kind: "hop", place: "Torres del Paine", mode: "car", detail: "2h" },
      { kind: "base", place: "Refugios on the W", nights: 4 },
      { kind: "hop", place: "Puerto Natales", mode: "ferry", detail: "3h" },
      { kind: "base", place: "Puerto Natales", nights: 3 },
    ],
    highlights: [
      "Base of the Towers at sunrise",
      "Grey glacier lookout",
      "French valley",
    ],
    bestMonths: "November to March",
    lat: -50.94,
    lng: -73.0,
    mapZoom: 7,
  },
  {
    id: "vietnam-north-to-south",
    title: "Vietnam, north to south",
    operator: "G Adventures",
    region: "Asia",
    country: "Vietnam",
    nights: 12,
    groupSize: "8–14 people",
    priceFromMinor: 132000,
    currency: "GBP",
    summary:
      "Hanoi down to the Mekong delta by overnight train and short flights, with a boat night on Lan Ha bay and two free days in Hội An.",
    legs: [
      { kind: "base", place: "Hanoi", nights: 3 },
      { kind: "base", place: "Lan Ha bay", nights: 1 },
      { kind: "hop", place: "Hội An", mode: "train", detail: "overnight" },
      { kind: "base", place: "Hội An", nights: 4 },
      { kind: "hop", place: "Ho Chi Minh City", mode: "flight", detail: "1h 20" },
      { kind: "base", place: "Ho Chi Minh City", nights: 2 },
      { kind: "base", place: "Mekong delta", nights: 2 },
    ],
    highlights: [
      "Lan Ha bay overnight",
      "Hải Vân pass by motorbike or car",
      "Cooking class in Hội An",
    ],
    bestMonths: "February to April, October",
    lat: 16.0,
    lng: 107.0,
    mapZoom: 5,
  },
  {
    id: "new-zealand-south-island",
    title: "South Island campervan loop",
    operator: "Flash Pack",
    region: "Oceania",
    country: "New Zealand",
    nights: 14,
    groupSize: "4–6 people",
    priceFromMinor: 310000,
    currency: "GBP",
    summary:
      "Christchurch to Queenstown the long way, two campervans, and campsites booked for the nights that sell out. Everything else is decided as you go.",
    legs: [
      { kind: "base", place: "Christchurch", nights: 1 },
      { kind: "hop", place: "West coast", mode: "car", detail: "4h 30" },
      { kind: "base", place: "Franz Josef", nights: 3 },
      { kind: "base", place: "Wanaka", nights: 2 },
      { kind: "base", place: "Queenstown", nights: 4 },
      { kind: "hop", place: "Milford Sound", mode: "car", detail: "4h" },
      { kind: "base", place: "Te Anau", nights: 2 },
      { kind: "base", place: "Aoraki / Mount Cook", nights: 2 },
    ],
    highlights: [
      "Franz Josef and the west coast",
      "Milford Sound before the coaches",
      "Aoraki / Mount Cook stargazing",
    ],
    bestMonths: "November to March",
    lat: -44.0,
    lng: 170.0,
    mapZoom: 6,
  },
];
