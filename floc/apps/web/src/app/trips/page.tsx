/**
 * /trips — post-login home (ticket 05; reskinned 193). Non-archived trips the
 * viewer is a member of. Sort (ticket 70) lives in the URL, not state,
 * so the page stays a server component and a view is linkable.
 *
 * Ticket 193: trips waiting on you are split off the top of the grid, whatever
 * the sort — the sort orders each half, it doesn't decide who blocks whom.
 */
import Link from "next/link";

import { requireUser } from "@/server/access";
import { listFriendsFor, type Person } from "@/server/friends";
import { listPendingInvitesFor, type PendingInvite } from "@/server/invites";
import { loadTripCards } from "./cards";
import { formatDateRange, hasEnded, splitEnded } from "@floc/core/dates";
import {
  Avatar,
  ButtonLink,
  Field,
  Input,
  Stack,
  cx,
} from "@/components/ui";
import { Sheet, SubmitButton } from "@/components/client-ui";
import { FriendPicker } from "@/components/friend-picker";
import { FlockChevron } from "@/components/flock-chevron";
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
  const view = params.view === "list" ? "list" : "grid";
  const tag = typeof params.tag === "string" ? params.tag.trim().toLowerCase() : "";

  const viewer = await requireUser("/trips");

  const [cardRows, invites, friends] = await Promise.all([
    loadTripCards(viewer.id, { archived: false }),
    listPendingInvitesFor(viewer.id),
    listFriendsFor(viewer.id),
  ]);

  const cards = cardRows.map((c) => c.card);
  const sorted = sortCards(
    tag ? cards.filter((card) => card.tags?.some((value) => value.toLowerCase() === tag)) : cards,
    sort,
  );
  // A finished trip is still yours, so it is folded away rather than dropped —
  // archiving is the other thing, and it is a decision someone has to make.
  const { live, ended } = splitEnded(sorted);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">My trips</h1>
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
            <SortIcon />
            {(Object.keys(SORTS) as Sort[]).map((key) => (
              <ButtonLink
                key={key}
                href={hrefFor({ sort: key, view, tag })}
                variant={key === sort ? "primary" : "secondary"}
                aria-current={key === sort ? "true" : undefined}
              >
                {SORTS[key]}
              </ButtonLink>
            ))}
          </div>
          <ViewToggle sort={sort} view={view} tag={tag} />
        </div>
      ) : null}

      {live.length === 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NewTripTile friends={friends} first={cards.length === 0} />
        </ul>
      ) : (
        <TripGrid trips={live} view={view} className="mt-8" />
      )}

      {ended.length > 0 ? <PastTrips trips={ended} view={view} /> : null}
    </div>
  );
}

function TripGrid({
  trips,
  view,
  className,
}: {
  trips: TripCardData[];
  view: "grid" | "list";
  className?: string;
}) {
  return (
    <ul
      className={cx(
        className,
        view === "list"
          ? "flex flex-col gap-3"
          // Flex, not grid, so a part-filled last row centres instead of
          // hanging left; the widths restate the 1/2/3 columns it replaces.
          : "flex flex-wrap justify-center gap-4 [&>li]:w-full sm:[&>li]:w-[calc((100%-1rem)/2)] lg:[&>li]:w-[calc((100%-2rem)/3)]",
      )}
    >
      {trips.map((t) => (
        <TripCard key={t.id} trip={t} href={`/trip/${t.id}/overview`} layout={view} />
      ))}
    </ul>
  );
}

/**
 * Trips that have finished, folded shut. Native `<details>` — the fold needs
 * no state, so the page stays a server component; the flock chevron is the
 * product's one disclosure mark (see [[flock-chevron]]).
 */
function PastTrips({ trips, view }: { trips: TripCardData[]; view: "grid" | "list" }) {
  return (
    <details className="past-trips mt-10">
      <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 text-ink-soft transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
        <FlockChevron size={12} className="past-trips-chevron shrink-0" />
        <span className="typed text-current">Past trips · {trips.length}</span>
      </summary>
      <TripGrid trips={trips} view={view} className="mt-5" />
    </details>
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

function hrefFor({
  sort,
  view,
  tag,
}: {
  sort: Sort;
  view?: "grid" | "list";
  tag?: string;
}) {
  const query = new URLSearchParams();
  if (sort !== "date") query.set("sort", sort);
  if (view === "list") query.set("view", view);
  if (tag) query.set("tag", tag);
  const q = query.toString();
  return q ? `/trips?${q}` : "/trips";
}

// The label for the sort row, drawn rather than spelled (three descending
// bars). Named for anything reading the outline; the pills beside it say which.
function SortIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className="text-ink-soft"
      role="img"
      aria-label="Sort"
    >
      <path d="M2 3.5h9M2 7h6M2 10.5h3" />
    </svg>
  );
}

// Grid/list switch, right-aligned on the controls row. Two icon links (the
// current one filled), in the app's own line-art — no icon font (CLAUDE.md).
function ViewToggle({
  sort,
  view,
  tag,
}: {
  sort: Sort;
  view: "grid" | "list";
  tag: string;
}) {
  const opts = [
    {
      key: "grid" as const,
      label: "Grid view",
      icon: (
        <svg viewBox="0 0 14 14" width="14" height="14" fill="currentColor" aria-hidden>
          <rect x="1" y="1" width="5" height="5" rx="1.2" />
          <rect x="8" y="1" width="5" height="5" rx="1.2" />
          <rect x="1" y="8" width="5" height="5" rx="1.2" />
          <rect x="8" y="8" width="5" height="5" rx="1.2" />
        </svg>
      ),
    },
    {
      key: "list" as const,
      label: "List view",
      icon: (
        <svg
          viewBox="0 0 14 14"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M2 3.5h10M2 7h10M2 10.5h10" />
        </svg>
      ),
    },
  ];
  return (
    <div className="ml-auto flex items-center gap-1 rounded-full bg-sheet-3 p-1">
      {opts.map((o) => (
        <Link
          key={o.key}
          href={hrefFor({ sort, view: o.key, tag })}
          aria-label={o.label}
          aria-current={o.key === view ? "true" : undefined}
          className={cx(
            "flex size-8 items-center justify-center rounded-full transition-colors",
            o.key === view
              ? "bg-ink text-sheet"
              : "text-ink-soft hover:bg-sheet hover:text-ink",
          )}
        >
          {o.icon}
        </Link>
      ))}
    </div>
  );
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
