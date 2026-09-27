import type * as Leaflet from "leaflet";

export type RouteMapStop = {
  /** Position in the FULL stop list, 1-based — so a pin's number matches its card. */
  no: number;
  name: string;
  /** Days the itinerary spends here — the yellow badge on the pin (ticket 69). */
  days: number;
  lat: number;
  lng: number;
};

export const dayWord = (days: number) => `${days} ${days === 1 ? "day" : "days"}`;

/** A numbered stop, with its days hanging off the corner unless something else shows them. */
export function routePin(L: typeof Leaflet, s: RouteMapStop, withDays = true): Leaflet.Marker {
  // "2 days", not "2d" (ticket 82) — an abbreviation only the map used read as a code.
  const days = withDays ? `<b class="day-pill route-pin-days">${dayWord(s.days)}</b>` : "";
  return L.marker([s.lat, s.lng], {
    keyboard: false,
    icon: L.divIcon({
      className: "route-pin",
      html: `<span>${s.no}</span>${days}`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    }),
    title: `${s.no}. ${s.name} — ${dayWord(s.days)}`,
    alt: `Stop ${s.no}: ${s.name}, ${dayWord(s.days)}`,
  });
}
