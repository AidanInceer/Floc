/**
 * /trips/archived — read-only for members; restore is admin-only (ticket 05,
 * ticket 17). No dedicated "request restore" UI in v1 — a member who wants a
 * trip back just asks an admin, so this page names them instead of building
 * a request/notify flow for something that can be solved by a WhatsApp
 * message.
 */
import { requireUser } from "@/server/access";
import { ButtonLink, EmptyState, Page, PageHeader } from "@/components/ui";
import { ConfirmSubmit } from "@/components/client-ui";
import { TripCard } from "@/components/trip-card";
import { loadTripCards } from "../cards";
import { restoreTrip } from "../actions";

export default async function ArchivedTripsPage() {
  const viewer = await requireUser("/trips/archived");

  // Same load-and-build as /trips, one predicate apart (ticket 117).
  const cards = (await loadTripCards(viewer.id, { archived: true })).map(
    ({ card, members }) => ({
      card,
      // Who to ask, since restoring is admin-only.
      admins: members.filter((m) => m.role === "admin"),
      isAdmin: card.role === "admin",
    }),
  );

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
