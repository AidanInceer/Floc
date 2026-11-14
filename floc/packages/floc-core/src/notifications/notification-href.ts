/** The web path a notification opens. The phone app handles the same path through `phoneRoute`. */
export type TripTab = "overview" | "dates" | "days" | "money" | "packing" | "notes";

export function tripHref(tripId: number, tab: TripTab): string {
  return `/trip/${tripId}/${tab}`;
}

/** The tab a comment thread is drawn on. Mirrors `threadPath` in the web app's freshness table. */
export function threadTab(scope: "trip" | "day" | "day_event" | "expense" | "page"): TripTab {
  if (scope === "day" || scope === "day_event") return "days";
  if (scope === "expense") return "money";
  if (scope === "page") return "notes";
  return "overview";
}

/** My trips with the new-trip sheet open and empty, where the "next trip?" prompt goes (#626). */
export const START_TRIP_HREF = "/trips?new=";

/** Why: the phone draws a trip's Overview at `/trip/[id]`, not `/trip/[id]/overview`, and starts a trip on its own screen. */
export function phoneRoute(href: string): string {
  if (href === START_TRIP_HREF) return "/new-trip";
  return href.replace(/^(\/trip\/\d+)\/overview$/, "$1");
}
