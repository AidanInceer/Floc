import Link from "next/link";

import type { TripColor } from "@floc/core/trip/trip-color";
import type { TripMark } from "@floc/core/trip/mark/trip-mark";
import { countdownLabel, formatDateRange } from "@floc/core/dates/dates";
import { Menu } from "@/components/system/client-ui";
import { AvatarRow, Badge, PASTEL_BY_KEY, cx } from "@/components/system/ui";
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import { TripColorPicker } from "@/components/trip/trip-color-picker";
import { TripMarkPicker } from "@/components/trip/trip-mark-picker";
import { TripMarkIcon } from "@/components/trip/trip-mark";
import { TripNameInline } from "@/components/trip/trip-name-inline";
import { TagChips } from "@/components/trip/overview/tag-chips";
import { renameTrip } from "@/app/trip/[id]/overview/actions";

const BAND: Record<TripColor, string> = {
  peri: "border-t-pastel-blue",
  mint: "border-t-pastel-green",
  butter: "border-t-pastel-yellow",
  blush: "border-t-pastel-red",
};
const EDGE: Record<TripColor, string> = {
  peri: "outline-pastel-blue-edge",
  mint: "outline-pastel-green-edge",
  butter: "outline-pastel-yellow-edge",
  blush: "outline-pastel-red-edge",
};
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export type OverviewTrip = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  archived: boolean;
  color: TripColor | null;
  /** The colour the trip wears: the picked one, or the id-rotation default. */
  tone: TripColor;
  mark: TripMark | null;
  tags: string[];
  nights: number;
};

export function OverviewCard({
  trip,
  going,
  spent,
}: {
  trip: OverviewTrip;
  going: { name: string; avatarIcon: AvatarIcon | null; tone?: string }[];
  /** The top-line total, already formatted; null while nothing is logged. */
  spent: string | null;
}) {
  const soon = countdownLabel(trip.startDate);
  return (
    <aside className={cx("relative flex min-w-0 flex-col gap-1.5 border-t-[6px] p-6 pt-5", BAND[trip.tone])}>
      <div className="absolute right-5 top-5">
        <Menu
          label="Colour and mark"
          trigger={<Stamp trip={trip} />}
          triggerClassName={cx(
            "grid h-[70px] w-[60px] rotate-[4deg] place-items-center content-center gap-1 rounded-md outline-2 outline-offset-[3px] outline-dotted",
            PASTEL_BY_KEY[trip.tone],
            EDGE[trip.tone],
          )}
        >
          <TripColorPicker tripId={trip.id} current={trip.color} />
          <TripMarkPicker tripId={trip.id} current={trip.mark} tone={trip.tone} />
        </Menu>
      </div>

      <div className="min-w-0 pr-20">
        <TripNameInline tripId={trip.id} name={trip.name} rename={renameTrip} />
      </div>
      {trip.archived ? (
        <span>
          <Badge tone="neutral">Archived</Badge>
        </span>
      ) : null}

      <p className="nums flex items-center gap-1.5 text-sm text-ink-soft">
        {trip.startDate
          ? `${formatDateRange(trip.startDate, trip.endDate)} · ${trip.nights} ${trip.nights === 1 ? "night" : "nights"}`
          : "Dates not set"}
        {/* Deciding dates is the Dates tab's job, where the group's availability is. */}
        <Link
          href={`/trip/${trip.id}/dates`}
          aria-label={trip.startDate ? "Change dates" : "Pick dates"}
          title={trip.startDate ? "Change dates" : "Pick dates"}
          className="grid size-6 place-items-center rounded-full text-ink-faint hover:bg-sheet-2 hover:text-ink"
        >
          <PencilIcon />
        </Link>
      </p>
      {soon ? <p className="font-display text-lg text-pastel-blue-ink">{soon.charAt(0).toUpperCase() + soon.slice(1)}</p> : null}

      <div className="mt-2">
        <TagChips tripId={trip.id} tags={trip.tags} skin={PASTEL_BY_KEY[trip.tone]} />
      </div>

      <div className="mt-4 border-t border-rule">
        <a href="#the-group" className="flex items-center gap-2.5 border-b border-rule py-3 text-sm text-ink-soft hover:text-ink">
          <AvatarRow people={going} max={5} size={26} />
          {going.length === 1 ? "Just you" : `${going.length} going`}
        </a>
        <Link href={`/trip/${trip.id}/money`} className="flex items-baseline gap-2.5 border-b border-rule py-3 text-sm text-ink-soft hover:text-ink">
          {spent ? (
            <>
              <span className="nums font-display text-lg text-pastel-green-ink">{spent}</span>
              spent
            </>
          ) : (
            "Nothing spent yet"
          )}
        </Link>
      </div>
    </aside>
  );
}

function Stamp({ trip }: { trip: OverviewTrip }) {
  const [, month, day] = trip.startDate?.split("-") ?? [];
  return (
    <>
      {trip.mark ? <TripMarkIcon mark={trip.mark} size={24} /> : <span className="size-6" />}
      {trip.startDate ? (
        <span className="nums text-[9px] tracking-[0.08em]">
          {Number(day)} {MONTHS[Number(month) - 1]}
        </span>
      ) : null}
    </>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 14 14" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.6 2.4l2 2-7 7-2.6.6.6-2.6z" />
    </svg>
  );
}
