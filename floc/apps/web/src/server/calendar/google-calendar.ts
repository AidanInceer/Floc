import "server-only";

import { addDays } from "@floc/core/dates/dates";
import type { CalendarEvent, ImportRange } from "@floc/core/dates/calendar-import";

export type EventsResult =
  | { ok: true; events: CalendarEvent[] }
  | { ok: false; reason: "denied" | "failed" };

const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const MAX_PAGES = 10;
const TIMEOUT_MS = 5_000;

function eventsUrl(range: ImportRange, pageToken: string | null): string {
  const q = new URLSearchParams({
    singleEvents: "true",
    timeMin: `${addDays(range.start, -1)}T00:00:00Z`,
    timeMax: `${addDays(range.end, 2)}T00:00:00Z`,
    maxResults: "250",
    maxAttendees: "1",
    fields: "nextPageToken,items(status,eventType,start,end,attendees(self,responseStatus))",
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
        signal: AbortSignal.timeout(TIMEOUT_MS),
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

export async function revokeGoogleToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok || res.status === 400;
  } catch {
    return false;
  }
}
