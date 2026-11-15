/**
 * Floc's own price table for the cost estimate (#574, ADR-057). Static data, read by nobody but `guide.ts`.
 *
 * Why hand-kept: the free flight-price APIs closed (Amadeus self-service, 17 July 2026) and the rest come
 * through affiliate networks (ADR-013). Every figure is a rough band, GBP minor units (rule 1), drafted on
 * 14 Nov 2026 from public fares and costs and not yet reviewed — so the app labels it Floc's rough guide
 * with no "checked" date until Aidan has checked it.
 */
import type { Cabin, Pace, StayStyle } from "../style";

type Band = readonly [number, number];
const gbp = (lo: number, hi: number): Band => [lo * 100, hi * 100];

/** UK airports with a flight guide. `fare` scales the London bands for the extra a regional airport usually costs. */
export const HOME_AIRPORTS = [
  { code: "LHR", name: "London Heathrow", fare: 1 },
  { code: "LGW", name: "London Gatwick", fare: 1 },
  { code: "STN", name: "London Stansted", fare: 1 },
  { code: "LTN", name: "London Luton", fare: 1 },
  { code: "LCY", name: "London City", fare: 1.05 },
  { code: "MAN", name: "Manchester", fare: 1.05 },
  { code: "BHX", name: "Birmingham", fare: 1.08 },
  { code: "BRS", name: "Bristol", fare: 1.08 },
  { code: "EDI", name: "Edinburgh", fare: 1.1 },
  { code: "GLA", name: "Glasgow", fare: 1.1 },
] as const;

export type Hub = { code: string; city: string; country: string; lat: number; lng: number; fare: Band };

/** Return economy fares from London, low to high, to hubs spread over every continent. */
export const HUBS: readonly Hub[] = [
  { code: "LIS", city: "Lisbon", country: "PT", lat: 38.77, lng: -9.13, fare: gbp(80, 200) },
  { code: "OPO", city: "Porto", country: "PT", lat: 41.24, lng: -8.68, fare: gbp(70, 180) },
  { code: "MAD", city: "Madrid", country: "ES", lat: 40.47, lng: -3.56, fare: gbp(70, 180) },
  { code: "BCN", city: "Barcelona", country: "ES", lat: 41.3, lng: 2.08, fare: gbp(60, 170) },
  { code: "AGP", city: "Málaga", country: "ES", lat: 36.67, lng: -4.5, fare: gbp(70, 190) },
  { code: "PMI", city: "Palma", country: "ES", lat: 39.55, lng: 2.74, fare: gbp(70, 200) },
  { code: "CDG", city: "Paris", country: "FR", lat: 49.01, lng: 2.55, fare: gbp(60, 160) },
  { code: "NCE", city: "Nice", country: "FR", lat: 43.66, lng: 7.22, fare: gbp(80, 200) },
  { code: "AMS", city: "Amsterdam", country: "NL", lat: 52.31, lng: 4.76, fare: gbp(60, 160) },
  { code: "BER", city: "Berlin", country: "DE", lat: 52.37, lng: 13.5, fare: gbp(60, 170) },
  { code: "MUC", city: "Munich", country: "DE", lat: 48.35, lng: 11.79, fare: gbp(80, 210) },
  { code: "FCO", city: "Rome", country: "IT", lat: 41.8, lng: 12.25, fare: gbp(80, 210) },
  { code: "MXP", city: "Milan", country: "IT", lat: 45.63, lng: 8.72, fare: gbp(60, 170) },
  { code: "NAP", city: "Naples", country: "IT", lat: 40.88, lng: 14.29, fare: gbp(80, 220) },
  { code: "CTA", city: "Catania", country: "IT", lat: 37.47, lng: 15.07, fare: gbp(100, 250) },
  { code: "ATH", city: "Athens", country: "GR", lat: 37.94, lng: 23.94, fare: gbp(110, 280) },
  { code: "HER", city: "Heraklion", country: "GR", lat: 35.34, lng: 25.18, fare: gbp(120, 300) },
  { code: "IST", city: "Istanbul", country: "TR", lat: 41.26, lng: 28.74, fare: gbp(120, 300) },
  { code: "DBV", city: "Dubrovnik", country: "HR", lat: 42.56, lng: 18.27, fare: gbp(100, 260) },
  { code: "SPU", city: "Split", country: "HR", lat: 43.54, lng: 16.3, fare: gbp(100, 260) },
  { code: "PRG", city: "Prague", country: "CZ", lat: 50.1, lng: 14.26, fare: gbp(60, 170) },
  { code: "BUD", city: "Budapest", country: "HU", lat: 47.44, lng: 19.26, fare: gbp(60, 170) },
  { code: "KRK", city: "Kraków", country: "PL", lat: 50.08, lng: 19.78, fare: gbp(50, 150) },
  { code: "VIE", city: "Vienna", country: "AT", lat: 48.11, lng: 16.57, fare: gbp(80, 200) },
  { code: "ZRH", city: "Zurich", country: "CH", lat: 47.46, lng: 8.55, fare: gbp(90, 230) },
  { code: "CPH", city: "Copenhagen", country: "DK", lat: 55.62, lng: 12.65, fare: gbp(70, 190) },
  { code: "OSL", city: "Oslo", country: "NO", lat: 60.19, lng: 11.1, fare: gbp(80, 220) },
  { code: "KEF", city: "Reykjavik", country: "IS", lat: 63.99, lng: -22.62, fare: gbp(120, 320) },
  { code: "DUB", city: "Dublin", country: "IE", lat: 53.42, lng: -6.27, fare: gbp(50, 140) },
  { code: "JFK", city: "New York", country: "US", lat: 40.64, lng: -73.78, fare: gbp(380, 750) },
  { code: "BOS", city: "Boston", country: "US", lat: 42.36, lng: -71.01, fare: gbp(380, 750) },
  { code: "ORD", city: "Chicago", country: "US", lat: 41.97, lng: -87.91, fare: gbp(450, 850) },
  { code: "MIA", city: "Miami", country: "US", lat: 25.79, lng: -80.29, fare: gbp(450, 850) },
  { code: "LAX", city: "Los Angeles", country: "US", lat: 33.94, lng: -118.41, fare: gbp(500, 950) },
  { code: "SFO", city: "San Francisco", country: "US", lat: 37.62, lng: -122.38, fare: gbp(500, 950) },
  { code: "YYZ", city: "Toronto", country: "CA", lat: 43.68, lng: -79.63, fare: gbp(400, 800) },
  { code: "YVR", city: "Vancouver", country: "CA", lat: 49.19, lng: -123.18, fare: gbp(550, 1000) },
  { code: "MEX", city: "Mexico City", country: "MX", lat: 19.44, lng: -99.07, fare: gbp(550, 1000) },
  { code: "CUN", city: "Cancún", country: "MX", lat: 21.04, lng: -86.87, fare: gbp(550, 1000) },
  { code: "SJO", city: "San José", country: "CR", lat: 9.99, lng: -84.2, fare: gbp(650, 1150) },
  { code: "HAV", city: "Havana", country: "CU", lat: 22.99, lng: -82.41, fare: gbp(550, 1000) },
  { code: "PUJ", city: "Punta Cana", country: "DO", lat: 18.57, lng: -68.36, fare: gbp(550, 1000) },
  { code: "BGI", city: "Barbados", country: "BB", lat: 13.07, lng: -59.49, fare: gbp(550, 1100) },
  { code: "BOG", city: "Bogotá", country: "CO", lat: 4.7, lng: -74.15, fare: gbp(600, 1100) },
  { code: "LIM", city: "Lima", country: "PE", lat: -12.02, lng: -77.11, fare: gbp(700, 1200) },
  { code: "GIG", city: "Rio de Janeiro", country: "BR", lat: -22.81, lng: -43.25, fare: gbp(650, 1150) },
  { code: "GRU", city: "São Paulo", country: "BR", lat: -23.43, lng: -46.47, fare: gbp(600, 1100) },
  { code: "EZE", city: "Buenos Aires", country: "AR", lat: -34.82, lng: -58.54, fare: gbp(750, 1300) },
  { code: "SCL", city: "Santiago", country: "CL", lat: -33.39, lng: -70.79, fare: gbp(800, 1350) },
  { code: "RAK", city: "Marrakech", country: "MA", lat: 31.61, lng: -8.04, fare: gbp(90, 250) },
  { code: "CAI", city: "Cairo", country: "EG", lat: 30.12, lng: 31.41, fare: gbp(300, 600) },
  { code: "NBO", city: "Nairobi", country: "KE", lat: -1.32, lng: 36.93, fare: gbp(550, 1000) },
  { code: "ZNZ", city: "Zanzibar", country: "TZ", lat: -6.22, lng: 39.22, fare: gbp(650, 1150) },
  { code: "CPT", city: "Cape Town", country: "ZA", lat: -33.97, lng: 18.6, fare: gbp(650, 1150) },
  { code: "DXB", city: "Dubai", country: "AE", lat: 25.25, lng: 55.36, fare: gbp(350, 700) },
  { code: "DEL", city: "Delhi", country: "IN", lat: 28.56, lng: 77.1, fare: gbp(450, 850) },
  { code: "BOM", city: "Mumbai", country: "IN", lat: 19.09, lng: 72.87, fare: gbp(450, 850) },
  { code: "CMB", city: "Colombo", country: "LK", lat: 7.18, lng: 79.88, fare: gbp(550, 1000) },
  { code: "MLE", city: "Malé", country: "MV", lat: 4.19, lng: 73.53, fare: gbp(650, 1200) },
  { code: "BKK", city: "Bangkok", country: "TH", lat: 13.69, lng: 100.75, fare: gbp(550, 1000) },
  { code: "HKT", city: "Phuket", country: "TH", lat: 8.11, lng: 98.32, fare: gbp(650, 1100) },
  { code: "HAN", city: "Hanoi", country: "VN", lat: 21.22, lng: 105.81, fare: gbp(600, 1100) },
  { code: "SGN", city: "Ho Chi Minh City", country: "VN", lat: 10.82, lng: 106.66, fare: gbp(600, 1100) },
  { code: "KUL", city: "Kuala Lumpur", country: "MY", lat: 2.75, lng: 101.71, fare: gbp(550, 1000) },
  { code: "SIN", city: "Singapore", country: "SG", lat: 1.36, lng: 103.99, fare: gbp(600, 1100) },
  { code: "DPS", city: "Bali", country: "ID", lat: -8.75, lng: 115.17, fare: gbp(700, 1200) },
  { code: "HKG", city: "Hong Kong", country: "HK", lat: 22.31, lng: 113.91, fare: gbp(600, 1100) },
  { code: "NRT", city: "Tokyo", country: "JP", lat: 35.77, lng: 140.39, fare: gbp(700, 1300) },
  { code: "ICN", city: "Seoul", country: "KR", lat: 37.46, lng: 126.44, fare: gbp(650, 1200) },
  { code: "SYD", city: "Sydney", country: "AU", lat: -33.94, lng: 151.18, fare: gbp(1000, 1800) },
  { code: "MEL", city: "Melbourne", country: "AU", lat: -37.67, lng: 144.84, fare: gbp(1000, 1800) },
  { code: "AKL", city: "Auckland", country: "NZ", lat: -37.01, lng: 174.79, fare: gbp(1100, 1900) },
];

/** How much a cabin multiplies an economy fare. */
export const CABIN_FARE: Record<Cabin, number> = { economy: 1, premium: 1.7, business: 3.5, first: 6 };

/** Per person, at UK prices: a night's share of a place to stay, a day's food and drink, a day's activities, a day's getting around. */
export const STAY_NIGHT: Record<StayStyle, Band> = { budget: gbp(25, 45), mid: gbp(55, 95), high: gbp(110, 200) };
export const FOOD_DAY: Record<StayStyle, Band> = { budget: gbp(20, 35), mid: gbp(35, 60), high: gbp(65, 110) };
export const ACTIVITY_DAY: Record<Pace, Band> = { easy: gbp(8, 20), balanced: gbp(20, 40), active: gbp(40, 75) };
export const TRANSPORT_DAY: Band = gbp(7, 15);

/**
 * How expensive each country is against the UK (UK = 1), from the World Bank price level index for
 * household spending (PA.NUS.PRVT.PLI, CC BY 4.0), rounded. A country not listed is taken as the UK.
 */
export const PRICE_LEVEL: Readonly<Record<string, number>> = {
  GB: 1, IE: 1.15, PT: 0.72, ES: 0.8, FR: 0.97, BE: 1, NL: 1.03, LU: 1.1, DE: 0.95, AT: 1, CH: 1.45,
  IT: 0.88, MT: 0.8, GR: 0.75, CY: 0.85, TR: 0.45, HR: 0.7, SI: 0.75, ME: 0.55, AL: 0.5, CZ: 0.68,
  SK: 0.68, HU: 0.6, PL: 0.55, RO: 0.5, BG: 0.48, DK: 1.2, SE: 1.05, NO: 1.3, FI: 1.1, IS: 1.4,
  EE: 0.8, LV: 0.72, LT: 0.7, US: 1.1, CA: 1, MX: 0.55, CR: 0.7, CU: 0.55, DO: 0.5, JM: 0.7,
  BB: 1, CO: 0.4, PE: 0.45, EC: 0.5, BR: 0.5, AR: 0.45, CL: 0.55, UY: 0.75, MA: 0.4, TN: 0.35,
  EG: 0.25, KE: 0.4, TZ: 0.4, ZA: 0.45, NA: 0.5, AE: 0.85, JO: 0.6, IL: 1.15, IN: 0.3, LK: 0.35,
  NP: 0.3, MV: 0.8, TH: 0.45, VN: 0.35, KH: 0.35, LA: 0.3, MY: 0.4, SG: 0.95, ID: 0.35, PH: 0.4,
  HK: 0.9, CN: 0.55, TW: 0.6, JP: 0.75, KR: 0.75, AU: 1.1, NZ: 1.05,
};
