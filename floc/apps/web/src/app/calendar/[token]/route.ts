/**
 * A member's subscribable trip calendar (#334). No session: calendar apps poll
 * with none, so the signed token is the whole check, and it is re-checked
 * against live membership on every poll. Outside the middleware matcher on
 * purpose — a redirect to /login would break every subscription.
 */
import { memberCalendar } from "@/server/itinerary/calendar-feed";
import { readCalendarToken } from "@/server/itinerary/calendar-link";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const holder = readCalendarToken(token.replace(/\.ics$/, ""));
  const ics = holder ? await memberCalendar(holder.tripId, holder.userId) : null;
  if (!ics) return new Response("Not found", { status: 404 });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
