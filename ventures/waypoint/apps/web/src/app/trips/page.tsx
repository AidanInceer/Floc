/**
 * /trips — post-login home (ticket 05; reskinned 193). Non-archived trips the
 * viewer is a member of. Sort/tag (tickets 70, 71) live in the URL, not state,
 * so the page stays a server component and a view is linkable.
 *
 * Ticket 193: trips waiting on you are split off the top of the grid, whatever
 * the sort — the sort orders each half, it doesn't decide who blocks whom.
 */
import type { ReactNode } from "react";

import { requireUser } from "@/server/access";
import { listFriendsFor, type Person } from "@/server/friends";
import { listPendingInvitesFor, type PendingInvite } from "@/server/membership";
import { loadTripCards } from "./cards";
import { formatDateRange, hasEnded } from "@/lib/dates";
import {
  Avatar,
  ButtonLink,
  Field,
  Input,
  Stack,
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
  const wanted = sorted.filter((c) => c.needsYou);
  const rest = sorted.filter((c) => !c.needsYou);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">My trips</h1>
          <p className="mt-3 text-md text-ink-soft">
            Every trip you&rsquo;re part of, in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/trips/archived" variant="ghost">
            Archived
          </ButtonLink>
          <Sheet trigger="New trip" title="Start a trip">
            <CreateTripForm friends={friends} />
          </Sheet>
        </div>
      </header>

      {invites.length > 0 ? <InviteList invites={invites} /> : null}

      {cards.length > 1 ? (
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="typed">Sort</span>
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
              <span className="typed">Tag</span>
              {allTags.map((tag) => (
                <ButtonLink
                  key={tag}
                  // Clicking the active tag clears it — the pill is the toggle.
                  href={hrefFor({ sort, tag: tag === activeTag ? null : tag })}
                  aria-current={tag === activeTag ? "true" : undefined}
                  variant={tag === activeTag ? "primary" : "secondary"}
                >
                  {tag}
                </ButtonLink>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTag && sorted.length === 0 ? (
        <Nothing
          title={`No trips tagged “${activeTag}”`}
          body="The tag is still on another trip somewhere, or it was just taken off this one."
          action={
            <ButtonLink href={hrefFor({ sort, tag: null })} variant="primary">
              Show every trip
            </ButtonLink>
          }
        />
      ) : sorted.length === 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NewTripTile friends={friends} first />
        </ul>
      ) : (
        <>
          {wanted.length > 0 ? (
            <>
              <SectionLabel
                left="Waiting on you"
                right={
                  wanted.length === 1
                    ? "One trip can’t move without you"
                    : `${wanted.length} trips can’t move without you`
                }
              />
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wanted.map((t) => (
                  <TripCard key={t.id} trip={t} href={`/trip/${t.id}/overview`} />
                ))}
              </ul>
            </>
          ) : null}

          <SectionLabel
            left={wanted.length > 0 ? "Everything else" : "Your trips"}
            right={wanted.length > 0 ? "Nothing outstanding" : undefined}
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((t) => (
              <TripCard key={t.id} trip={t} href={`/trip/${t.id}/overview`} />
            ))}
            <NewTripTile friends={friends} />
          </ul>
        </>
      )}

      <section className="mt-8 flex flex-wrap items-center gap-6 rounded-lg bg-pen-soft px-8 py-7 text-pen-deep">
        <div className="min-w-[16rem] flex-1">
          <h2 className="text-xl">Nowhere in mind yet?</h2>
          <p className="mt-2 max-w-[54ch] text-sm opacity-80">
            Explore has itineraries someone has already thought through, so the
            group has something to argue with.
          </p>
        </div>
        <ButtonLink href="/explore" variant="primary">
          Get inspired
        </ButtonLink>
      </section>
    </div>
  );
}

function SectionLabel({ left, right }: { left: string; right?: string }) {
  return (
    <div className="mb-4 mt-10 flex flex-wrap items-baseline justify-between gap-4">
      <span className="typed">{left}</span>
      {right ? <span className="typed">{right}</span> : null}
    </div>
  );
}

function Nothing({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className="mt-8 rounded-lg bg-sheet px-6 py-14 text-center">
      <h2 className="text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-[46ch] text-sm text-ink-soft">{body}</p>
      <div className="mt-6 flex justify-center">{action}</div>
    </div>
  );
}

/** The last tile in the grid is the way to add another one. */
function NewTripTile({ friends, first }: { friends: Person[]; first?: boolean }) {
  return (
    <li className="contents">
      <Sheet
        bareTrigger
        trigger={
          <span className="block text-left">
            <span className="typed text-current">
              {first ? "No trips yet" : "One more"}
            </span>
            <span className="mt-1 block font-display text-2xl font-semibold tracking-tight text-ink">
              Start a trip
            </span>
            <span className="mt-2 block max-w-[32ch] text-sm text-ink-soft">
              Name it, then ask your friends along. Dates can wait.
            </span>
          </span>
        }
        title="Start a trip"
        triggerClassName="lift flex min-h-[15rem] w-full flex-col justify-center rounded-lg bg-sheet p-6 text-left shadow-[inset_0_0_0_2px_var(--rule)] hover:shadow-[inset_0_0_0_2px_var(--pen)]"
      >
        <CreateTripForm friends={friends} />
      </Sheet>
    </li>
  );
}

function InviteList({ invites }: { invites: PendingInvite[] }) {
  return (
    <section className="mt-8 rounded-lg bg-butter p-6 text-butter-ink">
      <p className="typed text-current">
        {invites.length === 1 ? "An invitation" : "Invitations"} · waiting on you
      </p>
      <Stack gap={3} className="mt-4">
        {invites.map((invite) => (
          <div
            key={invite.tripId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-sheet/70 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={invite.fromName} src={invite.fromAvatarUrl} />
              <div className="min-w-0">
                <p className="text-sm">
                  <strong>{invite.fromName}</strong> invited you to{" "}
                  <strong>{invite.tripName}</strong>
                </p>
                {invite.startDate || invite.endDate ? (
                  <p className="nums text-xs opacity-75">
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
    </section>
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
