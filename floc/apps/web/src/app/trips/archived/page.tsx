/**
 * /trips/archived — read-only for members; restore is admin-only (ticket 05,
 * ticket 17; reskinned 193). No dedicated "request restore" UI in v1 — a
 * member who wants a trip back just asks an admin, so this page names them
 * instead of building a request/notify flow for something that can be solved
 * by a WhatsApp message.
 */
import { requireUser } from "@/server/access";
import { ButtonLink, PageTitle, EmptyState } from "@/components/system/ui";
import { ConfirmSubmit } from "@/components/system/client-ui";
import { TripCard } from "@/components/trip/trip-card";
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
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <PageTitle>Archived trips</PageTitle>
          <p className="mt-3 max-w-[58ch] text-md text-ink-soft">
            Trips you&rsquo;re part of that an admin has archived. Only an admin
            can restore one.
          </p>
        </div>
        <ButtonLink href="/trips" variant="ghost">
          Back to my trips
        </ButtonLink>
      </header>

      {cards.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Nothing archived">
            Trips an admin archives will show up here, still visible to every
            member.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ card, admins, isAdmin }) => (
            <TripCard
              key={card.id}
              past
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
    </div>
  );
}
