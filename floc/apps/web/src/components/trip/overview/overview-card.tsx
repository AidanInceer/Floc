import Link from "next/link";
import type { ReactNode } from "react";

import type { TripColor } from "@floc/core/trip/trip-color";
import type { TripMark } from "@floc/core/trip/mark/trip-mark";
import { countdownLabel, formatDateRange } from "@floc/core/dates/dates";
import { positionLines, type Position } from "@floc/core/money/position";
import { Menu } from "@/components/system/client-ui";
import { Badge, PASTEL_BY_KEY, cx } from "@/components/system/ui";
import { TripColorPicker } from "@/components/trip/trip-color-picker";
import { TripMarkPicker } from "@/components/trip/trip-mark-picker";
import { TripMarkIcon } from "@/components/trip/trip-mark";
import { TripNameInline } from "@/components/trip/trip-name-inline";
import { TagChips } from "@/components/trip/overview/tag-chips";
import { renameTrip } from "@/app/trip/[id]/overview/actions";
import { PencilIcon } from "@/components/system/icons";

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
  position,
  ideas,
}: {
  trip: OverviewTrip;
  /** Where the viewer stands with the group; null while nothing is logged. */
  position: Position | null;
  /** The ideas row, once the plan has a shape (ideasTucked). */
  ideas?: ReactNode;
}) {
  const soon = countdownLabel(trip.startDate);
  return (
    <aside className={cx("relative flex min-w-0 flex-col gap-1.5 rounded-[inherit] border-t-[6px] p-6 pt-5", BAND[trip.tone])}>
      <div className="absolute right-5 top-5">
        <Menu
          label="Colour and mark"
          trigger={<Stamp trip={trip} />}
          triggerClassName={cx(
            "group/stamp relative grid h-[70px] w-[60px] rotate-[4deg] place-items-center content-center gap-1 rounded-md outline-2 outline-offset-[3px] outline-dotted transition-transform duration-200 hover:rotate-0 hover:scale-105 hover:outline-solid focus-visible:rotate-0 data-[open=true]:rotate-0",
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
          <PencilIcon size={12} />
        </Link>
      </p>
      {soon ? <p className="font-display text-lg text-pastel-blue-ink">{soon.charAt(0).toUpperCase() + soon.slice(1)}</p> : null}

      <div className="mt-2">
        <TagChips tripId={trip.id} tags={trip.tags} skin={PASTEL_BY_KEY[trip.tone]} />
      </div>

      <div className="mt-4 border-t border-rule">
        <Link href={`/trip/${trip.id}/money`} className="flex items-baseline gap-2.5 border-b border-rule py-3 text-sm text-ink-soft hover:text-ink">
          <PositionLine position={position} />
        </Link>
        {ideas}
      </div>
    </aside>
  );
}

function PositionLine({ position }: { position: Position | null }) {
  if (!position) return "Nothing spent yet";
  return (
    <span className="flex flex-col gap-0.5">
      {positionLines(position).map((line) => (
        <span key={line.label} className="flex items-baseline gap-2.5">
          {line.figure ? line.label : <span className="font-display text-lg text-pastel-green-ink">{line.label}</span>}
          {line.figure ? (
            <span className={cx("nums text-lg", line.label === "You owe" ? "text-ink" : "text-pastel-green-ink")}>{line.figure}</span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

function Stamp({ trip }: { trip: OverviewTrip }) {
  const [, month, day] = trip.startDate?.split("-") ?? [];
  return (
    <>
      <span className="absolute -bottom-2.5 -right-2.5 grid size-6 place-items-center rounded-full bg-sheet text-ink-soft opacity-0 shadow-lift ring-1 ring-rule transition-opacity group-hover/stamp:opacity-100 group-focus-visible/stamp:opacity-100 group-data-[open=true]/stamp:opacity-100">
        <PencilIcon size={11} />
      </span>
      {trip.mark ? <TripMarkIcon mark={trip.mark} size={24} /> : <span className="size-6" />}
      {trip.startDate ? (
        <span className="nums text-[9px] tracking-[0.08em]">
          {Number(day)} {MONTHS[Number(month) - 1]}
        </span>
      ) : null}
    </>
  );
}
