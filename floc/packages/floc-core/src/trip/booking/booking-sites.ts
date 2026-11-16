export const FLIGHT_SITES = ["Google Flights", "Skyscanner", "Kayak", "Kiwi.com"] as const;
export const STAY_SITES = ["Booking.com", "Trip.com", "Airbnb", "Hotels.com", "Hostelworld"] as const;

export type FlightSite = (typeof FLIGHT_SITES)[number];
export type StaySite = (typeof STAY_SITES)[number];
export type BookingSite = FlightSite | StaySite;
export type SiteKind = "flights" | "stays";

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

export const MAX_SITES = 2;

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

export function toggleSite(sites: BookingSites, kind: SiteKind, site: BookingSite): BookingSites {
  if (!canToggleSite(sites, kind, site)) return sites;
  const list = sites[kind] as string[];
  const next = list.includes(site) ? list.filter((s) => s !== site) : [...list, site];
  return { ...sites, [kind]: next };
}

export type SiteChoice = { site: BookingSite; use: string; on: boolean; can: boolean; why: string | null };

export function siteChoices(sites: BookingSites, kind: SiteKind): SiteChoice[] {
  const mine = sites[kind] as readonly string[];
  return CATALOGUE[kind].map((site) => {
    const on = mine.includes(site);
    const can = canToggleSite(sites, kind, site);
    const why = can ? null : on ? "Keep at least one" : `Up to ${MAX_SITES}`;
    return { site, use: SITE_USE[site], on, can, why };
  });
}

export function splitBySites<L extends { site: string }>(links: L[], preferred: readonly string[]): { mine: L[]; more: L[] } {
  const mine = preferred.map((s) => links.find((l) => l.site === s)).filter((l): l is L => Boolean(l));
  return { mine, more: links.filter((l) => !preferred.includes(l.site)) };
}
