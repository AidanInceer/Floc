/**
 * Shared trip tile for /trips and /trips/archived (ticket 17; reskinned 193).
 * Server component — actions are passed in as slots so callers can wire
 * admin-only buttons without this file knowing about archive/restore/delete.
 *
 * Ticket 193: a trip waiting on you is the only blue card. Everything else
 * wears a quiet pastel, and an archived trip drains to white so last year's
 * trip stays readable without asking for anything.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { AvatarRow, PASTEL_BY_KEY, PASTEL_SKINS, cx } from "@/components/ui";
import { TripCardMenu } from "@/components/trip-card-menu";
import { daysUntil, formatDateRange, hasEnded } from "@/lib/dates";
import type { IsoDate } from "@/lib/dates";
import type { TripColor } from "@/lib/trip-color";
import type { TripRole } from "@/db/schema";

export type TripCardData = {
  id: number;
  name: string;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  role: TripRole;
  members: { name: string; avatarUrl?: string | null; tone?: string }[];
  needsYou?: boolean;
  where?: string | null; // first overnight place, or null if unsettled (ticket 70)
  tags?: string[];
  color?: TripColor | null; // chosen pastel (ticket 213); null = id-rotation
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
  const { skin, eyebrow, soon, soonFlag } = cardLook(trip, past);
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
      {soon && !list ? <UpcomingFlag bg={soonFlag} /> : null}
      <Link
        href={href}
        className={cx(
          "after:absolute after:inset-0 after:content-['']",
          // Narrow: a fixed stack — name, then dates and place, then tags.
          // Wrapping decided the order by title length, so "Japan - 2026" and
          // "Ski trip" laid their dates and tags out differently. Only once
          // there is room to flow do they sit on one line.
          list &&
            "flex min-w-0 flex-1 flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6",
        )}
      >
        <CardBody trip={trip} eyebrow={eyebrow} past={past} list={list} />
      </Link>

      {/* pointer-events-none hands clicks back to the overlay; actions re-enables. */}
      <div
        className={cx(
          "pointer-events-none relative flex flex-wrap items-center gap-3",
          list ? "ml-auto" : "mt-auto border-t border-ink/10 pt-4",
        )}
      >
        {soon && list ? <UpcomingFlag bg={soonFlag} inline /> : null}
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
          <div className="pointer-events-auto ml-auto">
            <TripCardMenu
              tripId={trip.id}
              tripName={trip.name}
              isAdmin={trip.role === "admin"}
              color={trip.color ?? null}
            />
          </div>
        )}
      </div>
    </li>
  );
}

// The tile's text: state eyebrow, name, dates, place and tags. In a grid tile
// they stack; in a list row they flow left to right (name, dates, place, then
// tags pushed to the right) so the row fills its width. Split out to keep
// TripCard under the complexity ceiling.
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
      <span className={cx("block", list && "min-w-0")}>
        <span className="typed block text-current">{eyebrow}</span>
        <h3 className={cx("mt-1", list ? "text-xl" : "text-2xl", past && "text-ink-soft")}>
          {trip.name}
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
        <p className={cx("nums text-xs opacity-75", !list && "mt-1.5")}>
          {formatDateRange(trip.startDate, trip.endDate)}
          {trip.where && !list ? <> · {trip.where}</> : null}
        </p>
        {trip.where && list ? (
          <>
            <span aria-hidden className="text-xs opacity-50 sm:hidden">
              ·
            </span>
            <p className="text-xs opacity-75">{trip.where}</p>
          </>
        ) : null}
      </span>
      {trip.tags?.length ? (
        <ul className={cx("flex flex-wrap gap-1.5", list ? "sm:ml-auto" : "mt-3")}>
          {trip.tags.map((tag) => (
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
      ) : null}
    </>
  );
}

// Labelled flag for a trip starting within the week. `bg` is the card's soon
// accent — the chosen colour's dark ink, or amber by default — so the flag
// matches the ring around it (ticket 213). Corner-pinned on a grid tile;
// `inline` rides it in the list row's right cluster, clear of the avatars.
function UpcomingFlag({ bg, inline }: { bg: string; inline?: boolean }) {
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
      Upcoming
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
): { skin: string; eyebrow: string; soon: boolean; soonFlag: string } {
  const ended = hasEnded(trip.endDate);
  const wanted = !past && Boolean(trip.needsYou);
  // Starting within the week gets the butter "attention" wash with a strong
  // dark-amber ring — the ring is what sets it apart from a card that merely
  // happens to roll butter in the pastel rotation, and the "Soon" flag plus the
  // countdown eyebrow carry the word. `daysUntil` is >= 0 from today; 7 is the
  // window.
  const until = past || ended ? null : daysUntil(trip.startDate);
  const soon = until !== null && until >= 0 && until <= 7;

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

  return {
    skin,
    eyebrow: cardEyebrow({ past, wanted, ended }),
    soon,
    soonFlag: accent.flag,
  };
}

// The card's one-word state, split out so `cardLook` stays under the complexity
// ceiling. Status is never colour alone (CLAUDE.md) — this is the word.
function cardEyebrow({
  past,
  wanted,
  ended,
}: {
  past?: boolean;
  wanted: boolean;
  ended: boolean;
}): string {
  if (past) return "Archived";
  if (wanted) return "Needs you";
  if (ended) return "Ended";
  return "Planning";
}
