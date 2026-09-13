import { notFound } from "next/navigation";

import { requireUser } from "@/server/access";
import { memberCalendar } from "@/server/itinerary/calendar-feed";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const viewer = await requireUser(`/trip/${id}/days`);
  const ics = await memberCalendar(Number(id), viewer.id);
  if (!ics) notFound();

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="trip-${id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
