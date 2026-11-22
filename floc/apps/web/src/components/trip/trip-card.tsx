import Link from "next/link";
import type { ReactNode } from "react";

import { AvatarRow, PASTEL_BY_KEY, PASTEL_SKINS, cx, iconButtonClass } from "@/components/system/ui";
import { TripCardMenu } from "@/components/trip/trip-card-menu";
import { muteTrip, starTrip } from "@/app/trips/actions";
import { BellIcon } from "@/components/system/icons";
import { daysUntil, formatDateRange } from "@floc/core/dates/dates";
import { tripListStage } from "@floc/core/trip/list-stage";
import type { IsoDate } from "@floc/core/dates/dates";
import type { OverviewRoute } from "@floc/core/trip/overview/route";
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import type { TripColor } from "@floc/core/trip/trip-color";
import type { TripMark } from "@floc/core/trip/mark/trip-mark";
import { TripMarkIcon } from "@/components/system/icons/trip-mark";
import type { TripRole } from "@/db/schema";

export type TripCardData = {
  id: number;
  name: string;
  startDate: IsoDate | null;
  endDate: IsoDate | null;
  role: TripRole;
  starred?: boolean;
  muted?: boolean;
  members: { name: string; avatarIcon?: AvatarIcon | null; tone?: string }[];
  needsYou?: boolean;
  where?: string | null;
  tags?: string[];
  color?: TripColor | null;
  mark?: TripMark | null;
  route?: OverviewRoute | null;
};

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
  past?: boolean;
  layout?: "grid" | "list";
}) {
  const { skin, eyebrow, flag, soonFlag } = cardLook(trip, past);
  const list = layout === "list";

  return (
    <li
      className={cx(
        "lift-card relative flex rounded-md",
        list
          ? "flex-row flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4"
          : "min-h-[15rem] flex-col gap-4 p-6",
        skin,
      )}
    >
      {flag && !list ? <StateFlag label={flag} bg={soonFlag} /> : null}
      <Link
        href={href}
        className={cx(
          "after:absolute after:inset-0 after:content-['']",
          list &&
            "flex min-w-0 flex-1 flex-col items-start gap-1 max-sm:basis-full sm:grid sm:grid-cols-[minmax(0,1fr)_11rem_minmax(0,9rem)] sm:[grid-template-areas:'name_dates_place'_'tags_tags_tags'] sm:gap-x-4 sm:gap-y-2",
        )}
      >
        <CardBody trip={trip} eyebrow={eyebrow} past={past} list={list} />
      </Link>

      <div
        className={cx(
          "pointer-events-none relative flex flex-wrap items-center gap-3",
          list ? "ml-auto justify-end sm:w-56 sm:flex-nowrap" : "mt-auto border-t border-ink/10 pt-4",
        )}
      >
        {flag && list ? <StateFlag label={flag} bg={soonFlag} inline /> : null}
        <AvatarRow people={trip.members} size={26} />
        {past ? (
          <>
            <span className="ml-auto font-mono text-[11px]">
              {trip.role === "admin" ? "Admin" : "Member"}
            </span>
            {actions ? (
              <div className="pointer-events-auto flex items-center gap-3">
                {actions}
              </div>
            ) : null}
          </>
        ) : (
          <TripCardActions trip={trip} />
        )}
      </div>
    </li>
  );
}

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
        <span className="typed flex items-center gap-1.5 text-current">
          {trip.mark ? <TripMarkIcon mark={trip.mark} size={14} /> : null}
          {eyebrow}
        </span>
        <h3 className={cx("mt-1", list ? "text-xl" : "text-2xl", past && "text-ink-soft")}>
          {trip.name}
        </h3>
      </span>
      <span
        className={cx(
          list && "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:contents",
        )}
      >
        <p className={cx("nums text-xs", list ? ON_NAME_LINE.dates : "mt-1.5")}>
          {formatDateRange(trip.startDate, trip.endDate)}
          {trip.where && !list ? <> · {trip.where}</> : null}
        </p>
        {trip.where && list ? (
          <>
            <span aria-hidden className="text-xs opacity-50 sm:hidden">
              ·
            </span>
            <p className={cx("truncate text-xs", ON_NAME_LINE.place)}>{trip.where}</p>
          </>
        ) : null}
      </span>
      {trip.tags?.length ? <TagList tags={trip.tags} past={past} list={list} /> : null}
    </>
  );
}

export function TripCardActions({ trip }: { trip: TripCardData }) {
  const isAdmin = trip.role === "admin";
  return (
    <div className="pointer-events-auto ml-auto flex items-center gap-1.5">
      <StarButton tripId={trip.id} tripName={trip.name} starred={Boolean(trip.starred)} />
      <MuteButton tripId={trip.id} tripName={trip.name} muted={Boolean(trip.muted)} />
      <TripCardMenu
        tripId={trip.id}
        tripName={trip.name}
        isAdmin={isAdmin}
        color={trip.color ?? null}
        mark={trip.mark ?? null}
      />
    </div>
  );
}

function MuteButton({ tripId, tripName, muted }: { tripId: number; tripName: string; muted: boolean }) {
  const label = muted ? `Unmute ${tripName}` : `Mute ${tripName}`;
  return (
    <form action={muteTrip}>
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="muted" value={String(!muted)} />
      <button type="submit" aria-label={label} aria-pressed={muted} title={label} className={iconButtonClass(muted)}>
        <BellIcon muted={muted} />
      </button>
    </form>
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
        className={iconButtonClass(starred)}
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

function StateFlag({ label, bg, inline }: { label: string; bg: string; inline?: boolean }) {
  return (
    <span
      className={cx(
        "pointer-events-none rounded-full font-mono font-semibold uppercase tracking-[0.08em] text-sheet",
        bg,
        inline
          ? "px-2 py-0.5 text-[11px]"
          : "absolute right-4 top-4 z-10 px-2.5 py-1 text-[11px]",
      )}
    >
      {label}
    </span>
  );
}

const SOON_ACCENT: Record<TripColor | "default", { ring: string; flag: string }> = {
  default: { ring: "shadow-[inset_0_0_0_2px_var(--highlight-ink)]", flag: "bg-highlight-ink" },
  peri: { ring: "shadow-[inset_0_0_0_2px_var(--pastel-blue-ink)]", flag: "bg-pastel-blue-ink" },
  mint: { ring: "shadow-[inset_0_0_0_2px_var(--pastel-green-ink)]", flag: "bg-pastel-green-ink" },
  butter: { ring: "shadow-[inset_0_0_0_2px_var(--pastel-yellow-ink)]", flag: "bg-pastel-yellow-ink" },
  blush: { ring: "shadow-[inset_0_0_0_2px_var(--pastel-red-ink)]", flag: "bg-pastel-red-ink" },
};

function cardLook(
  trip: TripCardData,
  past?: boolean,
): { skin: string; eyebrow: string; flag: string | null; soonFlag: string } {
  const eyebrow = tripListStage({ ...trip, needsYou: !past && trip.needsYou, archived: past });
  const happening = eyebrow === "Happening now";
  const until = eyebrow === "Planning" ? daysUntil(trip.startDate) : null;
  const upcoming = until !== null && until >= 0 && until <= 7;
  const flag = happening ? "Happening now" : upcoming ? "Upcoming" : null;
  const soon = flag !== null;

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
