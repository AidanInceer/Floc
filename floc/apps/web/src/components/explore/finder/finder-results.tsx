"use client";

import type { Ranked } from "@floc/core/trip/explore/finder/finder-rank";
import type { TripTag } from "@floc/core/trip/explore/finder/tag-groups";
import { tagsOf } from "@floc/core/trip/explore/finder/trip-tags";
import { useState } from "react";

import { ExploreTile, tagClass } from "@/components/explore/all/explore-tile";
import { linkClass } from "@/components/explore/finder/finder-chip";
import { CheckIcon } from "@/components/system/icons";
import { FlockChevron } from "@/components/system/flock-chevron";
import { ButtonLink, cx } from "@/components/system/ui";

// Twelve tiles fill four rows of three, or six of two.
const TILE_LIMIT = 12;

const hit = "inline-flex items-center gap-1 rounded-full border border-rule-strong px-2 py-px text-[11.5px]";

/** The tags a tile shows: yours it has, then yours it lacks; with nothing liked, the first few it carries. */
function TileTags({ row, likes }: { row: Ranked; likes: TripTag[] }) {
  if (row.shared) return <Tags on={row.shared.slice(0, 4)} />;
  if (!likes.length) return <Tags plain={tagsOf(row.trip).slice(0, 3)} />;
  return <Tags on={row.hits} off={likes.filter((x) => !row.hits.includes(x))} />;
}

function Tags({ on = [], off = [], plain = [] }: { on?: TripTag[]; off?: TripTag[]; plain?: TripTag[] }) {
  return (
    <span className="mt-1.5 flex flex-wrap gap-1 empty:hidden">
      {on.map((x) => (
        <span key={x} className={hit}>
          <CheckIcon size={10} />
          {x}
        </span>
      ))}
      {plain.map((x) => (
        <span key={x} className={hit}>
          {x}
        </span>
      ))}
      {off.map((x) => (
        <span key={x} className={cx(hit, "border-dashed text-ink-faint")}>
          {x}
        </span>
      ))}
    </span>
  );
}

function OwnTile({ signedIn }: { signedIn: boolean }) {
  return (
    <li className="col-span-full flex min-h-32 flex-col items-center justify-center text-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed border-rule-strong p-4">
      <span className={cx(tagClass, "border border-dashed border-rule-strong text-ink-soft")}>Anywhere</span>
      <strong className="font-display text-base font-semibold tracking-[-0.02em]">Your own</strong>
      <p className="text-[13px] text-ink-soft">No dates, no destination. See who agrees.</p>
      <ButtonLink href={signedIn ? "/trips" : "/signup"} className="mt-2">
        Start blank
      </ButtonLink>
    </li>
  );
}

const grid = "grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3";

/**
 * The trips, best first, as tiles. With tags liked and the best-match order, the ones with none of them
 * drop below a line: still there, never hidden.
 */
export function FinderResults({
  rows,
  likes,
  split,
  signedIn,
  onPick,
  onLike,
}: {
  rows: Ranked[];
  likes: TripTag[];
  split: boolean;
  signedIn: boolean;
  onPick: (presetId: string) => void;
  onLike: (presetId: string) => void;
}) {
  const [all, setAll] = useState(false);
  if (!rows.length) {
    return <p className="rounded-2xl border border-dashed border-rule-strong p-6 text-ink-soft">No trip fits all of that. Remove a filter.</p>;
  }
  const shown = all ? rows : rows.slice(0, TILE_LIMIT);
  const top = split ? shown.filter((r) => r.hits.length) : shown;
  const rest = split ? shown.filter((r) => !r.hits.length) : [];
  const tile = (r: Ranked, dim = false) => (
    <li key={r.trip.id} className={dim ? "opacity-75" : undefined}>
      <ExploreTile
        trip={r.trip}
        onPick={onPick}
        footer={
          <button type="button" className={linkClass} onClick={() => onLike(r.trip.id)}>
            More like this
          </button>
        }
      >
        <TileTags row={r} likes={likes} />
      </ExploreTile>
    </li>
  );
  const own = <OwnTile key="own" signedIn={signedIn} />;
  return (
    <>
      {top.length ? (
        <ul className={grid}>
          {top.map((r) => tile(r))}
          {rest.length ? null : own}
        </ul>
      ) : null}
      {rest.length ? (
        <>
          <div className="mb-3 mt-6 flex items-baseline justify-between border-t border-rule pt-3">
            <span className="typed text-ink-faint">Fits, but none of what you like</span>
            <span className="nums text-xs text-ink-faint">{rows.filter((r) => !r.hits.length).length}</span>
          </div>
          <ul className={grid}>
            {rest.map((r) => tile(r, true))}
            {own}
          </ul>
        </>
      ) : null}
      {rows.length > TILE_LIMIT ? (
        <button type="button" onClick={() => setAll(!all)} className="mx-auto mt-5 flex w-fit flex-col items-center gap-1 text-ink-soft hover:text-ink">
          <span className="typed">{all ? "Show fewer" : `Show ${rows.length - TILE_LIMIT} more`}</span>
          <FlockChevron size={12} className={cx("transition-transform", all && "rotate-180")} />
        </button>
      ) : null}
    </>
  );
}
