export type TripTab = "overview" | "dates" | "days" | "money" | "packing" | "notes" | "files";

export function tripHref(tripId: number, tab: TripTab): string {
  return `/trip/${tripId}/${tab}`;
}

export function threadTab(scope: "day_event" | "page"): TripTab {
  return scope === "page" ? "notes" : "days";
}

export const START_TRIP_HREF = "/trips?new=";

export function phoneRoute(href: string): string {
  if (href === START_TRIP_HREF) return "/new-trip";
  const [path, query] = href.split("?");
  const route = path.replace(/^(\/trip\/\d+)\/overview$/, "$1");
  return query ? `${route}?${query}` : route;
}
