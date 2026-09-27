import type { RouteMapStop } from "@/components/map/route-map";
import { dayWord } from "@/components/map/route-pin";

export type Visit = { first: RouteMapStop; label: string; days: string; stops: number[] };

/** One visit per place, so a route that comes back to a place shows one pin there, not two on top of each other. */
export function visitsOf(stops: readonly RouteMapStop[]): Visit[] {
  const byPlace = new Map<string, number[]>();
  stops.forEach((s, i) => {
    const key = `${s.lat},${s.lng}`;
    byPlace.set(key, [...(byPlace.get(key) ?? []), i]);
  });
  return [...byPlace.values()].map((at) => {
    const here = at.map((i) => stops[i] as RouteMapStop);
    const days = here.map((s) => s.days);
    return {
      first: here[0] as RouteMapStop,
      label: here.map((s) => s.no).join("·"),
      days: days.length > 1 ? `${days.join(" + ")} days` : dayWord(days[0] as number),
      stops: at,
    };
  });
}
