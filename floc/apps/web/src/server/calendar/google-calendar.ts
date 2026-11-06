/**
 * Google's calendar API, and nothing else (#444, ADR-031). Asks for each event's start, end,
 * status and the person's own reply, so titles, places, notes and guests never leave Google.
 *
 * Why nothing is logged here: an event, a token or an address is personal data. A failure says
 * only which kind it was.
 */
import "server-only";

import { addDays } from "@floc/core/dates/dates";
import type { CalendarEvent, ImportRange } from "@floc/core/dates/calendar-import";

export type EventsResult =
  | { ok: true; events: CalendarEvent[] }
  | { ok: false; reason: "denied" | "failed" };

const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
// 250 events a page, ten pages: a calendar past that is not one a person is reading by eye.
const MAX_PAGES = 10;

/**
 * Why padded by a day either side: the calendar's own zone is unknown until Google answers, and
 * `core` clips to the range by the date in each answer. Google returns times in the calendar's
 * zone unless asked otherwise, so that date is the calendar's local date (rule 10).
 */
function eventsUrl(range: ImportRange, pageToken: string | null): string {
  const q = new URLSearchParams({
    singleEvents: "true",
    timeMin: `${addDays(range.start, -1)}T00:00:00Z`,
    timeMax: `${addDays(range.end, 2)}T00:00:00Z`,
    maxResults: "250",
    // Why 1: more attendees would come back with their addresses; one keeps only the person's own.
    maxAttendees: "1",
    fields: "nextPageToken,items(status,start,end,attendees(self,responseStatus))",
  });
  if (pageToken) q.set("pageToken", pageToken);
  return `${EVENTS_URL}?${q}`;
}

export async function listPrimaryEvents(accessToken: string, range: ImportRange): Promise<EventsResult> {
  const events: CalendarEvent[] = [];
  let pageToken: string | null = null;
  try {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const res = await fetch(eventsUrl(range, pageToken), {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) return { ok: false, reason: "denied" };
      if (!res.ok) return { ok: false, reason: "failed" };
      const body = (await res.json()) as { items?: CalendarEvent[]; nextPageToken?: string };
      events.push(...(body.items ?? []));
      if (!body.nextPageToken) return { ok: true, events };
      pageToken = body.nextPageToken;
    }
    return { ok: true, events };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/** True when Google no longer honours the token: revoked now, or already dead (a 400 says so). */
export async function revokeGoogleToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
    return res.ok || res.status === 400;
  } catch {
    return false;
  }
}
