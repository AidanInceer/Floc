import { memberCalendar } from "@/server/itinerary/feed/calendar-feed";
import { readCalendarToken } from "@/server/itinerary/feed/calendar-link";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const holder = readCalendarToken(token.replace(/\.ics$/, ""));
  const ics = holder ? await memberCalendar(holder.tripId, holder.userId, holder.epoch) : null;
  if (!ics) return new Response("Not found", { status: 404 });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
