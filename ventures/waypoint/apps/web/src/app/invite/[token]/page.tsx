/**
 * /invite/[token] — pre-auth teaser (ticket 01 step 2, ticket 05, ticket 19).
 *
 * How much shows scales with trip progress:
 *   bare shell (name + member count) → dates if set → idea count →
 *   route outline if days exist.
 * Never reveals member emails, expense amounts, or note bodies pre-auth —
 * those need membership, not just the link.
 */
import { and, count, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { day, idea, place, trip, tripMembership } from "@/db/schema";
import { getSession } from "@/lib/access";
import { formatDateRange } from "@/lib/dates";
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  Page,
  Stack,
} from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { joinTrip } from "./actions";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const found = await db
    .select()
    .from(trip)
    .where(and(eq(trip.inviteToken, token), isNull(trip.deletedAt)))
    .get();
  if (!found) notFound();

  const session = await getSession();

  if (session?.user) {
    const membership = await db
      .select({ userId: tripMembership.userId })
      .from(tripMembership)
      .where(
        and(
          eq(tripMembership.tripId, found.id),
          eq(tripMembership.userId, session.user.id),
          isNull(tripMembership.deletedAt),
        ),
      )
      .get();
    // Already a member: the teaser has nothing left to offer them.
    if (membership) redirect(`/trip/${found.id}/overview`);
  }

  const [{ value: memberCount }] = await db
    .select({ value: count() })
    .from(tripMembership)
    .where(
      and(eq(tripMembership.tripId, found.id), isNull(tripMembership.deletedAt)),
    );

  const [{ value: ideaCount }] = await db
    .select({ value: count() })
    .from(idea)
    .where(and(eq(idea.tripId, found.id), isNull(idea.deletedAt)));

  const days = await db
    .select({
      date: day.date,
      overnightPlaceId: day.overnightPlaceId,
      placeName: place.name,
    })
    .from(day)
    .leftJoin(place, eq(place.id, day.overnightPlaceId))
    .where(and(eq(day.tripId, found.id), isNull(day.deletedAt)))
    .orderBy(day.date)
    .all();

  // Consecutive days sharing an overnight place collapse into one "stop",
  // outline only — no times, notes or per-day detail (schema comment on `day`).
  const stops: string[] = [];
  for (const d of days) {
    const label = d.placeName ?? "Unset stop";
    if (stops[stops.length - 1] !== label) stops.push(label);
  }

  const redirectTo = `/invite/${token}`;

  return (
    <Page>
      <div className="mx-auto max-w-lg pt-10">
        <Card>
          <CardHeader
            title="You're invited"
            hint="Waypoint — plan a trip with the group"
          />
          <Stack gap={4} className="p-5">
            <div>
              <h1 className="font-display text-2xl font-semibold">{found.name}</h1>
              <p className="mt-1 text-sm text-ink-soft">
                {memberCount} {memberCount === 1 ? "person" : "people"} already in
              </p>
            </div>

            {found.startDate || found.endDate ? (
              <p className="text-sm text-ink">
                {formatDateRange(found.startDate, found.endDate)}
              </p>
            ) : null}

            {ideaCount > 0 ? (
              <p className="text-sm text-ink">
                <Badge tone="open">{ideaCount} idea{ideaCount === 1 ? "" : "s"}</Badge>{" "}
                on the board so far
              </p>
            ) : null}

            {stops.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  Route so far
                </p>
                <p className="text-sm text-ink">{stops.join(" → ")}</p>
              </div>
            ) : null}

            {!session?.user ? (
              <ButtonLink
                variant="primary"
                href={`/signup?redirect=${encodeURIComponent(redirectTo)}&via=link`}
              >
                Join this trip
              </ButtonLink>
            ) : (
              <form action={joinTrip.bind(null, token)}>
                <SubmitButton pendingLabel="Joining…">Join this trip</SubmitButton>
              </form>
            )}
          </Stack>
        </Card>
      </div>
    </Page>
  );
}
