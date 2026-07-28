/**
 * /trips/archived — read-only for members; restore is admin-only (ticket 05,
 * ticket 17). No dedicated "request restore" UI in v1 — a member who wants a
 * trip back just asks an admin, so this page names them instead of building
 * a request/notify flow for something that can be solved by a WhatsApp
 * message.
 */
import { and, eq, isNull, not } from "drizzle-orm";

import { db } from "@/db";
import { trip, tripMembership } from "@/db/schema";
import { listMembersFor, requireUser } from "@/lib/access";
import { ButtonLink, EmptyState, Page, PageHeader } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client-ui";
import { TripCard } from "@/components/trip-card";
import type { TripCardData } from "@/components/trip-card";
import { restoreTrip } from "../actions";

export default async function ArchivedTripsPage() {
  const viewer = await requireUser("/trips/archived");

  const rows = await db
    .select({
      id: trip.id,
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      role: tripMembership.role,
    })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(
      and(
        eq(tripMembership.userId, viewer.id),
        isNull(tripMembership.deletedAt),
        isNull(trip.deletedAt),
        not(isNull(trip.archivedAt)),
      ),
    )
    .all();

  // One roster query for every card, not one per card.
  const membersByTrip = await listMembersFor(rows.map((r) => r.id));

  const cards = rows.map((r) => {
    const members = membersByTrip.get(r.id) ?? [];
    const admins = members.filter((m) => m.role === "admin");
    const card: TripCardData = {
      id: r.id,
      name: r.name,
      startDate: r.startDate,
      endDate: r.endDate,
      role: r.role,
      members,
    };
    return { card, admins, isAdmin: r.role === "admin" };
  });

  return (
    <Page>
      <PageHeader
        title="Archived trips"
        subtitle="Trips you're part of that an admin has archived. Only an admin can restore one."
        actions={
          <ButtonLink href="/trips" variant="ghost">
            Back to my trips
          </ButtonLink>
        }
      />

      {cards.length === 0 ? (
        <EmptyState title="Nothing archived">
          Trips an admin archives will show up here, still visible to every
          member.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {cards.map(({ card, admins, isAdmin }) => (
            <TripCard
              key={card.id}
              trip={card}
              href={`/trip/${card.id}/overview`}
              actions={
                isAdmin ? (
                  <form action={restoreTrip.bind(null, card.id)}>
                    <ConfirmSubmit
                      variant="secondary"
                      message={`Restore "${card.name}"? It'll reappear in My trips.`}
                    >
                      Restore
                    </ConfirmSubmit>
                  </form>
                ) : (
                  <span className="text-xs text-ink-faint">
                    Ask {admins.map((a) => a.name).join(" or ")} to restore this
                  </span>
                )
              }
            />
          ))}
        </ul>
      )}
    </Page>
  );
}
