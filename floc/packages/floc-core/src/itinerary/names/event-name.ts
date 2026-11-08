import type { DayEventType } from "../../vocabulary";
import { EVENT_CATEGORIES } from "../event-categories";

/** Why: rows written before the title column (ticket 74) have none, and a block must never be blank. */
export function eventName(event: { title: string | null; placeName: string | null; type: DayEventType }): string {
  return event.title ?? event.placeName ?? EVENT_CATEGORIES[event.type].label;
}
