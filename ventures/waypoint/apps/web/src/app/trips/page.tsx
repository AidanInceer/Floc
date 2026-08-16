/**
 * /trips — post-login home (ticket 05). Non-archived trips the viewer is a
 * member of. Sort/tag (tickets 70, 71) live in the URL, not state, so the
 * page stays a server component and a view is linkable.
 */
import { requireUser } from "@/server/access";
import { listFriendsFor, type Person } from "@/server/friends";
import { listPendingInvitesFor, type PendingInvite } from "@/server/membership";
import { loadTripCards } from "./cards";
import { formatDateRange, hasEnded } from "@/lib/dates";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Page,
  PageHeader,
  Stack,
  cx,
} from "@/components/ui";
import { Sheet, SubmitButton } from "@/components/client-ui";
import { FriendPicker } from "@/components/friend-picker";
import { TripCard } from "@/components/trip-card";
import type { TripCardData } from "@/components/trip-card";
import { acceptTripInvite, createTrip, declineTripInvite } from "./actions";

const SORTS = {
  date: "Date",
  place: "Place",
  name: "Name",
} as const;
type Sort = keyof typeof SORTS;

function readSort(value: string | string[] | undefined): Sort {
  return typeof value === "string" && value in SORTS ? (value as Sort) : "date";
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sort = readSort(params.sort);
  const activeTag = typeof params.tag === "string" ? params.tag : null;

  const viewer = await requireUser("/trips");

  const [cardRows, invites, friends] = await Promise.all([
    loadTripCards(viewer.id, { archived: false }),
    listPendingInvitesFor(viewer.id),
    listFriendsFor(viewer.id),
  ]);

  const cards = cardRows.map((c) => c.card);

  const allTags = [...new Set(cards.flatMap((c) => c.tags ?? []))].sort();
  const filtered = activeTag
    ? cards.filter((c) => c.tags?.includes(activeTag))
    : cards;

  const sorted = sortCards(filtered, sort);

  return (
    <Page>
      <PageHeader
        title="My trips"
        subtitle="Every trip you're part of, in one place."
        actions={
          <>
            <ButtonLink href="/trips/archived" variant="ghost">
              Archived
            </ButtonLink>
            <Sheet trigger="New trip" title="Start a trip">
              <CreateTripForm friends={friends} />
            </Sheet>
          </>
        }
      />

      {invites.length > 0 ? (
        <div className="mb-5">
          <InviteList invites={invites} />
        </div>
      ) : null}

      {cards.length > 1 ? (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
              Sort
            </span>
            {(Object.keys(SORTS) as Sort[]).map((key) => (
              <ButtonLink
                key={key}
                href={hrefFor({ sort: key, tag: activeTag })}
                variant={key === sort ? "primary" : "secondary"}
                aria-current={key === sort ? "true" : undefined}
              >
                {SORTS[key]}
              </ButtonLink>
            ))}
          </div>
          {allTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
                Tag
              </span>
              {allTags.map((tag) => (
                <a
                  key={tag}
                  // Clicking the active tag clears it — the pill is the toggle.
                  href={hrefFor({ sort, tag: tag === activeTag ? null : tag })}
                  aria-current={tag === activeTag ? "true" : undefined}
                  className={cx(
                    "rounded-sm",
                    tag === activeTag ? "ring-1 ring-pen" : "opacity-80 hover:opacity-100",
                  )}
                >
                  <Badge tone="open">{tag}</Badge>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTag && sorted.length === 0 ? (
        <EmptyState
          title={`No trips tagged “${activeTag}”`}
          action={
            <ButtonLink href={hrefFor({ sort, tag: null })} variant="secondary">
              Show every trip
            </ButtonLink>
          }
        >
          The tag is still on another trip somewhere, or it was just taken off
          this one.
        </EmptyState>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No trips yet"
          action={
            <Sheet trigger="Start your first trip" title="Start a trip">
              <CreateTripForm friends={friends} />
            </Sheet>
          }
        >
          Start one with just a name — you can decide dates and destinations
          with the group once it exists.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((t) => (
            <TripCard key={t.id} trip={t} href={`/trip/${t.id}/overview`} />
          ))}
        </ul>
      )}
    </Page>
  );
}

function InviteList({ invites }: { invites: PendingInvite[] }) {
  return (
    <Card>
      <CardHeader
        title={invites.length === 1 ? "An invitation" : "Invitations"}
        hint="Waiting on you."
      />
      <Stack gap={3} className="p-4">
        {invites.map((invite) => (
          <div
            key={invite.tripId}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={invite.fromName} src={invite.fromAvatarUrl} />
              <div className="min-w-0">
                <p className="text-sm">
                  <strong>{invite.fromName}</strong> invited you to{" "}
                  <strong>{invite.tripName}</strong>
                </p>
                {invite.startDate || invite.endDate ? (
                  <p className="text-xs text-ink-faint">
                    {formatDateRange(invite.startDate, invite.endDate)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              <form action={acceptTripInvite}>
                <input type="hidden" name="tripId" value={invite.tripId} />
                <SubmitButton variant="primary" pendingLabel="Joining…">
                  Join
                </SubmitButton>
              </form>
              <form action={declineTripInvite}>
                <input type="hidden" name="tripId" value={invite.tripId} />
                <SubmitButton variant="ghost" pendingLabel="Declining…">
                  Decline
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </Stack>
    </Card>
  );
}

function hrefFor({ sort, tag }: { sort: Sort; tag: string | null }) {
  const query = new URLSearchParams();
  if (sort !== "date") query.set("sort", sort);
  if (tag) query.set("tag", tag);
  const q = query.toString();
  return q ? `/trips?${q}` : "/trips";
}

/** `date` (default) is the only order that splits ended/upcoming; others are flat A-Z. */
function sortCards(cards: TripCardData[], sort: Sort): TripCardData[] {
  const byName = (a: TripCardData, b: TripCardData) =>
    a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" });

  if (sort === "name") return [...cards].sort(byName);

  if (sort === "place") {
    return [...cards].sort((a, b) => {
      if (a.where && b.where) {
        const byPlace = a.where.localeCompare(b.where, "en-GB", { sensitivity: "base" });
        return byPlace !== 0 ? byPlace : byName(a, b);
      }
      if (a.where) return -1;
      if (b.where) return 1;
      return byName(a, b);
    });
  }

  const ended = cards.filter((c) => hasEnded(c.endDate));
  const upcoming = cards.filter((c) => !hasEnded(c.endDate));

  upcoming.sort((a, b) => {
    if (a.startDate && b.startDate) return a.startDate < b.startDate ? -1 : 1;
    if (a.startDate) return -1;
    if (b.startDate) return 1;
    return 0;
  });
  ended.sort((a, b) => {
    if (a.endDate && b.endDate) return a.endDate > b.endDate ? -1 : 1;
    return 0;
  });

  return [...upcoming, ...ended];
}

function CreateTripForm({ friends }: { friends: Person[] }) {
  return (
    <form action={createTrip}>
      <Stack gap={4}>
        <Field label="Name">
          <Input name="name" required />
        </Field>
        {/* Optional — invites, doesn't add members. */}
        <Field label="Ask your friends along">
          <FriendPicker
            friends={friends}
            emptyNote="No friends yet — share the trip link once it exists."
          />
        </Field>
        {/* No date fields — rule 9: undated is the normal path. */}
        <SubmitButton pendingLabel="Creating…">Create trip</SubmitButton>
      </Stack>
    </form>
  );
}
