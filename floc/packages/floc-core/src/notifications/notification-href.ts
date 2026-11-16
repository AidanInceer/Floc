export type TripTab = "overview" | "dates" | "days" | "money" | "packing" | "notes";

export function tripHref(tripId: number, tab: TripTab): string {
  return `/trip/${tripId}/${tab}`;
}

export function threadTab(scope: "trip" | "day" | "day_event" | "expense" | "page"): TripTab {
  if (scope === "day" || scope === "day_event") return "days";
  if (scope === "expense") return "money";
  if (scope === "page") return "notes";
  return "overview";
}

export const START_TRIP_HREF = "/trips?new=";

export function phoneRoute(href: string): string {
  if (href === START_TRIP_HREF) return "/new-trip";
  return href.replace(/^(\/trip\/\d+)\/overview$/, "$1");
}
