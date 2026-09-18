/**
 * Shared trip tile for /trips and /trips/archived (ticket 17; reskinned 193).
 * Server component — actions are passed in as slots so callers can wire
 * admin-only buttons without this file knowing about archive/restore/delete.
 *
 * Ticket 193: a trip waiting on you is the only blue card. Everything else
 * wears a quiet pastel, and an archived trip drains to white so last year's
 * trip stays readable without asking for anything.
 */
import { titleCase } from "@floc/core/text/title-case";
import Link from "next/link";
import type { ReactNode } from "react";

import { AvatarRow, PASTEL_BY_KEY, PASTEL_SKINS, cx } from "@/components/system/ui";
import { TripCardMenu } from "@/components/trip/trip-card-menu";
import { starTrip } from "@/app/trips/actions";
import { daysUntil, formatDateRange } from "@floc/core/dates/dates";
import { tripListStage } from "@floc/core/trip/list-stage";
import type { IsoDate } from "@floc/core/dates/dates";
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { TripColor } from "@floc/core/trip/trip-color";
import type { TripMark } from "@floc/core/trip/mark/trip-mark";
import { TripMarkIcon } from "@/components/trip/trip-mark";
import type { TripRole } from "@/db/schema";

export type TripCardData = {
  id: number;
  name: string;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  role: TripRole;
  /** The viewer's own star. */
  starred?: boolean;
  /** The viewer's own mute (#346). */
  muted?: boolean;
  members: { name: string; avatarIcon?: AvatarIcon | null; tone?: string }[];
  needsYou?: boolean;
  where?: string | null; // first overnight place, or null if unsettled (ticket 70)
  tags?: string[];
  color?: TripColor | null; // chosen pastel (ticket 213); null = id-rotation
  mark?: TripMark | null; // chosen mark (#318); null = the pastel alone
};

// No pastel carries meaning here — a trip isn't a domain — so the rotation is
// `PASTEL_SKINS` by id, which keeps a card the same colour every visit.
export function TripCard({
  trip,
  href,
  actions,
  past,
  layout = "grid",
}: {
  trip: TripCardData;
  href: string;
  actions?: ReactNode;
  /** Archived — drained of colour, still readable. */
  past?: boolean;
  /** Grid tile (default) or a compact horizontal row for the list view. */
  layout?: "grid" | "list";
}) {
  const { skin, eyebrow, flag, soonFlag } = cardLook(trip, past);
  const list = layout === "list";

  return (
    // Ticket 120: the whole tile navigates via a stretched ::after overlay on
    // the anchor, rather than wrapping avatars/admin buttons, which would nest
    // interactives inside a link.
    <li
      className={cx(
        "lift relative flex rounded-lg",
        list
          ? "flex-row flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4"
          : "min-h-[15rem] flex-col gap-4 p-6",
        skin,
      )}
    >
      {/* The one clear flag for a trip in the next week — labelled, so the
          highlight is never colour alone. Pinned to the top-right corner of a
          grid tile; in a list row it rides inline in the right cluster instead,
          where a corner pill would sit on top of the avatars. */}
      {flag && !list ? <StateFlag label={flag} bg={soonFlag} /> : null}
      <Link
        href={href}
        className={cx(
          "after:absolute after:inset-0 after:content-['']",
          // Narrow: a fixed stack — name, then dates and place, then tags.
          // Wide: name with its tags under it, then dates and place in fixed
          // columns sitting on the name's last line, so they line up down the list.
          list &&
            "flex min-w-0 flex-1 flex-col items-start gap-1 max-sm:basis-full sm:grid sm:grid-cols-[minmax(0,1fr)_11rem_minmax(0,9rem)] sm:[grid-template-areas:'name_dates_place'_'tags_tags_tags'] sm:gap-x-4 sm:gap-y-2",
        )}
      >
        <CardBody trip={trip} eyebrow={eyebrow} past={past} list={list} />
      </Link>

      {/* pointer-events-none hands clicks back to the overlay; actions re-enables. */}
      <div
        className={cx(
          "pointer-events-none relative flex flex-wrap items-center gap-3",
          list ? "ml-auto justify-end sm:w-56 sm:flex-nowrap" : "mt-auto border-t border-ink/10 pt-4",
        )}
      >
        {flag && list ? <StateFlag label={flag} bg={soonFlag} inline /> : null}
        <AvatarRow people={trip.members} size={26} />
        {/* Archived cards keep the role label and the caller's restore slot;
            a live card trades the label for its own actions menu (ticket 213),
            which is where colour, rename, archive and delete now live. */}
        {past ? (
          <>
            <span className="ml-auto font-mono text-[11.5px] opacity-70">
              {trip.role === "admin" ? "Admin" : "Member"}
            </span>
            {actions ? (
              <div className="pointer-events-auto flex items-center gap-3">
                {actions}
              </div>
            ) : null}
          </>
        ) : (
          <LiveActions trip={trip} />
        )}
      </div>
    </li>
  );
}

// The tile's text: state eyebrow, name, dates, place and tags. In a grid tile
// they stack; in a list row the name and its tags sit left, with dates and
// place beside the name. Split out to keep TripCard under the complexity ceiling.
function CardBody({
  trip,
  eyebrow,
  past,
  list,
}: {
  trip: TripCardData;
  eyebrow: string;
  past?: boolean;
  list: boolean;
}) {
  return (
    <>
      <span className={cx("block", list && "min-w-0 sm:[grid-area:name]")}>
        {/* The mark rides on the eyebrow line rather than in a band of its own:
            the card is already the trip's pastel, so a second coloured block
            would say the same thing twice (#318). */}
        <span className="typed flex items-center gap-1.5 text-current">
          {trip.mark ? <TripMarkIcon mark={trip.mark} size={14} /> : null}
          {eyebrow}
        </span>
        <h3 className={cx("mt-1", list ? "text-xl" : "text-2xl", past && "text-ink-soft")}>
          {titleCase(trip.name)}
        </h3>
      </span>
      {/* `sm:contents` dissolves this wrapper once the row flows, so dates and
          place go back to being their own columns. Stacked, they read as one
          meta line instead of two. */}
      <span
        className={cx(
          list && "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:contents",
        )}
      >
        <p className={cx("nums text-xs opacity-75", list ? ON_NAME_LINE.dates : "mt-1.5")}>
          {formatDateRange(trip.startDate, trip.endDate)}
          {trip.where && !list ? <> · {trip.where}</> : null}
        </p>
        {trip.where && list ? (
          <>
            <span aria-hidden className="text-xs opacity-50 sm:hidden">
              ·
            </span>
            <p className={cx("truncate text-xs opacity-75", ON_NAME_LINE.place)}>{trip.where}</p>
          </>
        ) : null}
      </span>
      {trip.tags?.length ? <TagList tags={trip.tags} past={past} list={list} /> : null}
    </>
  );
}

function LiveActions({ trip }: { trip: TripCardData }) {
  const isAdmin = trip.role === "admin";
  return (
    <div className="pointer-events-auto ml-auto flex items-center gap-1.5">
      <StarButton tripId={trip.id} tripName={trip.name} starred={Boolean(trip.starred)} />
      <TripCardMenu
        tripId={trip.id}
        tripName={trip.name}
        isAdmin={isAdmin}
        color={trip.color ?? null}
        mark={trip.mark ?? null}
        muted={Boolean(trip.muted)}
      />
    </div>
  );
}

function StarButton({
  tripId,
  tripName,
  starred,
}: {
  tripId: number;
  tripName: string;
  starred: boolean;
}) {
  const label = starred ? `Unstar ${tripName}` : `Star ${tripName}`;
  return (
    <form action={starTrip}>
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="starred" value={String(!starred)} />
      <button
        type="submit"
        aria-label={label}
        aria-pressed={starred}
        title={label}
        className={cx(
          "flex h-[26px] w-[26px] items-center justify-center rounded-full border transition-colors",
          starred
            ? "border-rule-strong bg-sheet text-ink"
            : "border-transparent text-ink-faint hover:border-rule-strong hover:bg-sheet-2 hover:text-ink",
        )}
      >
        <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden>
          <path
            d="M7 1.9 8.6 5.2 12.2 5.7 9.6 8.2 10.2 11.8 7 10.1 3.8 11.8 4.4 8.2 1.8 5.7 5.4 5.2Z"
            fill={starred ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}

// Bottom of the name's cell, nudged up to the title's baseline.
const ON_NAME_LINE = {
  dates: "sm:[grid-area:dates] sm:self-end sm:pb-1.5",
  place: "sm:[grid-area:place] sm:self-end sm:pb-1.5",
};

function TagList({ tags, past, list }: { tags: string[]; past?: boolean; list: boolean }) {
  return (
    <ul className={cx("flex flex-wrap gap-1.5", list ? "sm:[grid-area:tags]" : "mt-3")}>
      {tags.map((tag) => (
        <li
          key={tag}
          className={cx(
            "rounded-full px-3 py-1 text-xs font-semibold",
            past ? "bg-sheet-2" : "bg-sheet/70",
          )}
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

// Labelled flag for a trip starting within the week. `bg` is the card's soon
// accent — the chosen colour's dark ink, or amber by default — so the flag
// matches the ring around it (ticket 213). Corner-pinned on a grid tile;
// `inline` rides it in the list row's right cluster, clear of the avatars.
function StateFlag({ label, bg, inline }: { label: string; bg: string; inline?: boolean }) {
  return (
    <span
      className={cx(
        "pointer-events-none rounded-full font-mono font-semibold uppercase tracking-[0.08em] text-sheet",
        bg,
        inline
          ? "px-2 py-0.5 text-[9px]"
          : "absolute right-4 top-4 z-10 px-2.5 py-1 text-[10px]",
      )}
    >
      {label}
    </span>
  );
}

// The dark-ink ring + flag a "soon" card wears. Amber by default; a chosen
// colour (ticket 213) swaps in its own ink so the emphasis matches the pastel.
// Written out as literal class strings so Tailwind generates each one.
const SOON_ACCENT: Record<TripColor | "default", { ring: string; flag: string }> = {
  default: { ring: "shadow-[inset_0_0_0_2px_var(--highlight-ink)]", flag: "bg-highlight-ink" },
  peri: { ring: "shadow-[inset_0_0_0_2px_var(--peri-ink)]", flag: "bg-peri-ink" },
  mint: { ring: "shadow-[inset_0_0_0_2px_var(--mint-ink)]", flag: "bg-mint-ink" },
  butter: { ring: "shadow-[inset_0_0_0_2px_var(--butter-ink)]", flag: "bg-butter-ink" },
  blush: { ring: "shadow-[inset_0_0_0_2px_var(--blush-ink)]", flag: "bg-blush-ink" },
};

// The card's colour and its one-word state, kept out of the component so the
// branching doesn't push its complexity over the ceiling.
function cardLook(
  trip: TripCardData,
  past?: boolean,
): { skin: string; eyebrow: string; flag: string | null; soonFlag: string } {
  const eyebrow = tripListStage({ ...trip, needsYou: !past && trip.needsYou, archived: past });
  const happening = eyebrow === "Happening now";
  // Why: the ring, not the butter wash, sets a soon or running trip apart from a
  // card that merely rolls butter in the rotation; the flag carries the word.
  const until = eyebrow === "Planning" ? daysUntil(trip.startDate) : null;
  const upcoming = until !== null && until >= 0 && until <= 7;
  const flag = happening ? "Happening now" : upcoming ? "Upcoming" : null;
  const soon = flag !== null;

  // A chosen colour (ticket 213) sets the pastel; only the archived drain fully
  // overrides it. A "soon" card keeps a ring and its Upcoming flag + countdown
  // eyebrow carry the word — and both the ring and the flag take the chosen
  // colour's dark ink, or amber when nothing is picked.
  const accent = SOON_ACCENT[trip.color ?? "default"];
  const restingSkin = trip.color
    ? PASTEL_BY_KEY[trip.color]
    : PASTEL_SKINS[trip.id % PASTEL_SKINS.length];
  const skin = past
    ? "bg-sheet text-ink-soft shadow-[inset_0_0_0_1.5px_var(--rule)]"
    : soon
      ? cx(
          trip.color ? PASTEL_BY_KEY[trip.color] : "bg-highlight text-highlight-ink",
          accent.ring,
        )
      : restingSkin;

  return { skin, eyebrow, flag, soonFlag: accent.flag };
}
