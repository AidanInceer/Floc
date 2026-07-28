/**
 * Shared list row for /trips and /trips/archived (ticket 17). Server
 * component — no interactivity of its own, actions are passed in as slots
 * so callers can wire admin-only buttons without this file knowing about
 * archive/restore/delete.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { AvatarRow, Badge, Card } from "@/components/ui";
import { countdownLabel, formatDateRange, hasEnded } from "@/lib/dates";
import type { IsoDate } from "@/lib/dates";
import type { TripRole } from "@/db/schema";

export type TripCardData = {
  id: number;
  name: string;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  role: TripRole;
  /** `tone` is each member's roster avatar colour — see `TripMember.tone`. */
  members: { name: string; avatarUrl?: string | null; tone?: string }[];
  /** Low-key hint that something on this trip wants the viewer's attention. */
  needsYou?: boolean;
};

export function TripCard({
  trip,
  href,
  actions,
}: {
  trip: TripCardData;
  href: string;
  actions?: ReactNode;
}) {
  const ended = hasEnded(trip.endDate);
  // Countdown is only meaningful for a trip that hasn't ended yet — an ended
  // trip keeps its "Ended" label and nothing else (ticket 01 step 8: label,
  // not a lock, so no urgency chrome needed for something already over).
  const countdown = ended ? null : countdownLabel(trip.startDate);

  return (
    <Card as="li" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Link href={href} className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-semibold">{trip.name}</span>
          {ended ? <Badge tone="action">Ended</Badge> : null}
          {countdown ? <Badge tone="marine">{countdown}</Badge> : null}
          {trip.needsYou ? <Badge tone="action">Needs you</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>
      </Link>
      <div className="flex items-center gap-3">
        <AvatarRow people={trip.members} size={24} />
        <Badge tone={trip.role === "admin" ? "marine" : "neutral"}>
          {trip.role === "admin" ? "Admin" : "Member"}
        </Badge>
        {actions}
      </div>
    </Card>
  );
}
