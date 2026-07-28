/**
 * Static listings for the Explore mockup. There is no partner backend and no
 * partner deal — every operator name below is an illustrative placeholder for
 * what a real listing would look like. See ventures/waypoint/docs/partner-trips.md.
 *
 * Money is minor units, like everywhere else (CLAUDE.md rule 1) — these are
 * formatted with `formatMoney`, never by hand.
 */
import type { Currency } from "@/db/schema";

export type PresetTrip = {
  id: string;
  title: string;
  /** Who the itinerary comes from. Illustrative only — nothing is a partner. */
  operator: string;
  /** True for the ones Waypoint would write itself rather than sell space for. */
  editorial?: boolean;
  region: Region;
  country: string;
  nights: number;
  groupSize: string;
  priceFromMinor: number;
  currency: Currency;
  summary: string;
  highlights: string[];
  bestMonths: string;
  /**
   * Where the map thumbnail is centred — the destination, not the country
   * centroid, so the Highlands listing shows Torridon rather than Edinburgh.
   * Hand-set alongside a zoom because the right frame is editorial: an island
   * loop wants the whole island, a coast week wants the coast.
   */
  lat: number;
  lng: number;
  mapZoom: number;
};

/**
 * One pastel per region, reused by the filter chips and by every listing's
 * tag, so the two read as the same key. These are the same `who-*` tokens the
 * avatars use — the palette is deliberately shared rather than a second one
 * invented here. Colour never carries the meaning alone: the tag spells the
 * region out beside the country.
 */
export const REGION_TONE: Record<Region, string> = {
  Europe: "who-2",
  Africa: "who-4",
  Asia: "who-3",
  Americas: "who-1",
  Oceania: "who-6",
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
