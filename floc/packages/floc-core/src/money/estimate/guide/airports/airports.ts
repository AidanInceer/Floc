/** Find a home airport by code, name or city (#574, ADR-057). The list loads on first use, so only the field that searches pays for it. */
export type Airport = { code: string; name: string; city: string; country: string; large: boolean };

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

export function parseAirports(byCountry: Readonly<Record<string, string>>): Airport[] {
  return Object.entries(byCountry).flatMap(([country, packed]) =>
    packed.split(";").map((entry) => {
      const [code = "", name = "", city = "", size] = entry.split("|");
      return { code, name, city, country, large: size === "L" };
    }),
  );
}

function rank(airport: Airport, query: string): number | null {
  if (airport.code.toLowerCase() === query) return 0;
  const name = fold(airport.name), city = fold(airport.city);
  if (name.startsWith(query)) return 1;
  if (city.startsWith(query)) return 2;
  if (name.includes(query) || city.includes(query)) return 3;
  return null;
}

export function searchAirports(airports: readonly Airport[], query: string, limit = 8): Airport[] {
  const q = fold(query);
  if (!q) return [];
  const hits: { airport: Airport; rank: number }[] = [];
  for (const airport of airports) {
    const r = rank(airport, q);
    if (r != null) hits.push({ airport, rank: r });
  }
  hits.sort((a, b) => a.rank - b.rank || Number(b.airport.large) - Number(a.airport.large) || a.airport.name.localeCompare(b.airport.name));
  return hits.slice(0, limit).map((h) => h.airport);
}

export function findAirport(airports: readonly Airport[], code: string | null): Airport | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return airports.find((a) => a.code === upper) ?? null;
}

export const airportLabel = (airport: Pick<Airport, "code" | "name">) => `${airport.name} (${airport.code})`;

/** The line under an airport's name. Why: a no-break space keeps the country on its city's line when the row wraps. */
export const airportPlace = (airport: Pick<Airport, "code" | "city" | "country">) =>
  `${airport.code} · ${airport.city ? `${airport.city}, ` : ""}${airport.country}`;

let loading: Promise<Airport[]> | null = null;

export function loadAirports(): Promise<Airport[]> {
  loading ??= import("./airport-list").then(
    (m) => parseAirports(m.AIRPORTS_BY_COUNTRY),
    (error: unknown) => {
      loading = null;
      throw error;
    },
  );
  return loading;
}

/** A saved home airport as its field shows it. A code saved before the list (or since dropped from it) still shows. */
export async function chosenAirport(code: string | null): Promise<{ code: string; label: string } | null> {
  if (!code) return null;
  const airport = findAirport(await loadAirports(), code);
  return airport ? { code: airport.code, label: airportLabel(airport) } : { code, label: code };
}
