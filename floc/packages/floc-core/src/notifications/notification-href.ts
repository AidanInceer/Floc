/** The web path a notification opens. The phone app handles the same path through `phoneRoute`. */
export type TripTab = "overview" | "dates" | "days" | "money" | "packing" | "notes";

export function tripHref(tripId: number, tab: TripTab): string {
  return `/trip/${tripId}/${tab}`;
}

/** The tab a comment thread is drawn on. Mirrors `threadPath` in the web app's freshness table. */
export function threadTab(scope: "trip" | "day" | "day_event" | "expense"): TripTab {
  if (scope === "day" || scope === "day_event") return "days";
  if (scope === "expense") return "money";
  return "overview";
}

/** Why: the phone draws a trip's Overview at `/trip/[id]`, not `/trip/[id]/overview`. */
export function phoneRoute(href: string): string {
  return href.replace(/^(\/trip\/\d+)\/overview$/, "$1");
}
