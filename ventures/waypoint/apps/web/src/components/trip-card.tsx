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

import { AvatarRow, cx } from "@/components/ui";
import { countdownLabel, formatDateRange, hasEnded } from "@/lib/dates";
import type { IsoDate } from "@/lib/dates";
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
};

// No pastel carries meaning here — a trip isn't a domain — so the rotation is
// by id, which keeps a card the same colour every visit.
const PASTELS = [
  "bg-peri text-peri-ink",
  "bg-mint text-mint-ink",
  "bg-butter text-butter-ink",
  "bg-blush text-blush-ink",
] as const;

export function TripCard({
  trip,
  href,
  actions,
  past,
}: {
  trip: TripCardData;
  href: string;
  actions?: ReactNode;
  /** Archived — drained of colour, still readable. */
  past?: boolean;
}) {
  const ended = hasEnded(trip.endDate);
  const countdown = ended ? null : countdownLabel(trip.startDate);
  const wanted = !past && Boolean(trip.needsYou);

  const skin = past
    ? "bg-sheet text-ink-soft shadow-[inset_0_0_0_1.5px_var(--rule)]"
    : wanted
      ? "bg-pen-soft text-pen-deep shadow-[inset_0_0_0_2px_var(--pen)]"
      : PASTELS[trip.id % PASTELS.length];

  // The eyebrow says what state the trip is in — never a sentence repeating
  // what the card already shows.
  const eyebrow = past
    ? "Archived"
    : wanted
      ? "Needs you"
      : ended
        ? "Ended"
        : (countdown ?? "Planning");

  return (
    // Ticket 120: the whole tile navigates via a stretched ::after overlay on
    // the anchor, rather than wrapping avatars/admin buttons, which would nest
    // interactives inside a link.
    <li
      className={cx(
        "lift relative flex min-h-[15rem] flex-col gap-4 rounded-lg p-6",
        skin,
      )}
    >
      <Link href={href} className="after:absolute after:inset-0 after:content-['']">
        <p className="typed opacity-70">{eyebrow}</p>
        <h3 className={cx("mt-1 text-2xl", past && "text-ink-soft")}>
          {trip.name}
        </h3>
        <p className="nums mt-1.5 text-xs opacity-75">
          {formatDateRange(trip.startDate, trip.endDate)}
          {trip.where ? <> · {trip.where}</> : null}
        </p>
        {trip.tags?.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
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
      </Link>

      {/* pointer-events-none hands clicks back to the overlay; actions re-enables. */}
      <div className="pointer-events-none relative mt-auto flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
        <AvatarRow people={trip.members} size={26} />
        <span className="ml-auto font-mono text-[11.5px] opacity-70">
          {trip.role === "admin" ? "Admin" : "Member"}
        </span>
        {actions ? (
          <div className="pointer-events-auto flex items-center gap-3">
            {actions}
          </div>
        ) : null}
      </div>
    </li>
  );
}
