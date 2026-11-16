import type { DayEventType } from "../../vocabulary";
import { EVENT_CATEGORIES } from "../event-categories";

export function eventName(event: { title: string | null; placeName: string | null; type: DayEventType }): string {
  return event.title ?? event.placeName ?? EVENT_CATEGORIES[event.type].label;
}
