/**
 * Why: your sites show as buttons and the rest wait in a menu (wireframe/booking-sites J).
 * At least one and at most three a kind, so a row never empties or runs long.
 */

export const FLIGHT_SITES = ["Google Flights", "Skyscanner", "Kayak", "Kiwi.com"] as const;
export const STAY_SITES = ["Booking.com", "Trip.com", "Airbnb", "Hotels.com", "Hostelworld"] as const;

export type FlightSite = (typeof FLIGHT_SITES)[number];
export type StaySite = (typeof STAY_SITES)[number];
export type BookingSite = FlightSite | StaySite;
export type SiteKind = "flights" | "stays";

/** What each site is for, said once beside it in the More sites list. */
export const SITE_USE: Record<BookingSite, string> = {
  "Google Flights": "Compare fares",
  Skyscanner: "Compare fares",
  Kayak: "Compare fares",
  "Kiwi.com": "Mix airlines",
  "Booking.com": "Hotels and flats",
  "Trip.com": "Hotels and flats",
  Airbnb: "Whole homes and rooms",
  "Hotels.com": "Hotels and flats",
  Hostelworld: "Hostels",
};

export type BookingSites = { flights: FlightSite[]; stays: StaySite[] };

export const MAX_SITES = 3;

export const DEFAULT_BOOKING_SITES: BookingSites = {
  flights: ["Google Flights", "Skyscanner"],
  stays: ["Booking.com", "Trip.com"],
};

const CATALOGUE: { [K in SiteKind]: readonly BookingSites[K][number][] } = {
  flights: FLIGHT_SITES,
  stays: STAY_SITES,
};

function readKind<K extends SiteKind>(kind: K, raw: unknown): BookingSites[K] {
  if (!Array.isArray(raw)) return DEFAULT_BOOKING_SITES[kind];
  const known = CATALOGUE[kind] as readonly unknown[];
  const picked = [...new Set(raw)].filter((s) => known.includes(s)).slice(0, MAX_SITES);
  return (picked.length ? picked : DEFAULT_BOOKING_SITES[kind]) as BookingSites[K];
}

/** A stored choice, read safely: a bad shape or an empty kind reads as the default. */
export function readBookingSites(raw: unknown): BookingSites {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return { flights: readKind("flights", obj.flights), stays: readKind("stays", obj.stays) };
}

const isOfKind = (kind: SiteKind, site: string) => (CATALOGUE[kind] as readonly string[]).includes(site);

export function canToggleSite(sites: BookingSites, kind: SiteKind, site: BookingSite): boolean {
  if (!isOfKind(kind, site)) return false;
  const list = sites[kind] as string[];
  return list.includes(site) ? list.length > 1 : list.length < MAX_SITES;
}

/** Adds a site at the end of your list, or drops it. A move the rules refuse returns the same object. */
export function toggleSite(sites: BookingSites, kind: SiteKind, site: BookingSite): BookingSites {
  if (!canToggleSite(sites, kind, site)) return sites;
  const list = sites[kind] as string[];
  const next = list.includes(site) ? list.filter((s) => s !== site) : [...list, site];
  return { ...sites, [kind]: next };
}

/** Your sites first, in the order you chose them; the rest after, in catalogue order. */
export function splitBySites<L extends { site: string }>(links: L[], preferred: readonly string[]): { mine: L[]; more: L[] } {
  const mine = preferred.map((s) => links.find((l) => l.site === s)).filter((l): l is L => Boolean(l));
  return { mine, more: links.filter((l) => !preferred.includes(l.site)) };
}
