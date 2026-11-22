"use client";

import type { Ranked } from "@floc/core/trip/explore/finder/finder-rank";
import type { TripTag } from "@floc/core/trip/explore/finder/tag-groups";
import { tagsOf } from "@floc/core/trip/explore/finder/trip-tags";
import { useState } from "react";

import { ExploreTile, tagClass } from "@/components/explore/all/explore-tile";
import { CheckIcon } from "@/components/system/icons";
import { ChevronIcon } from "@/components/system/icons";
import { ButtonLink, cx } from "@/components/system/ui";
import { startTripHref } from "@/lib/landing/start-trip";

const TILE_LIMIT = 11;

const hit = "inline-flex items-center gap-1 rounded-full border border-rule-strong px-2 py-px text-[11px]";

function TileTags({ row, likes }: { row: Ranked; likes: TripTag[] }) {
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

function OwnTile({ signedIn, name }: { signedIn: boolean; name: string | null }) {
  return (
    <li className="flex min-h-56 flex-col items-center justify-center text-center gap-1.5 rounded-md border-[1.5px] border-dashed border-rule-strong p-4">
      <span className={cx(tagClass, "border border-dashed border-rule-strong text-ink-soft")}>{name ?? "Anywhere"}</span>
      <strong className="font-display text-base font-semibold tracking-[-0.02em]">Your own</strong>
      <ButtonLink href={name ? startTripHref(signedIn, name) : signedIn ? "/trips" : "/signup"} className="mt-2">
        Start blank
      </ButtonLink>
    </li>
  );
}

const grid = "grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3";

export function FinderResults({
  rows,
  likes,
  split,
  signedIn,
  blankName,
}: {
  rows: Ranked[];
  likes: TripTag[];
  split: boolean;
  signedIn: boolean;
  blankName: string | null;
}) {
  const [all, setAll] = useState(false);
  const own = <OwnTile key="own" signedIn={signedIn} name={blankName} />;
  if (!rows.length) {
    return (
      <>
        {blankName ? null : <p className="mb-4 text-ink-soft">No trip fits all of that. Remove a filter.</p>}
        <ul className={grid}>{own}</ul>
      </>
    );
  }
  const shown = all ? rows : rows.slice(0, TILE_LIMIT);
  const top = split ? shown.filter((r) => r.hits.length) : shown;
  const rest = split ? shown.filter((r) => !r.hits.length) : [];
  const tile = (r: Ranked, dim = false) => (
    <li key={r.trip.id} className={dim ? "opacity-75" : undefined}>
      <ExploreTile trip={r.trip} match={r.fit}>
        <TileTags row={r} likes={likes} />
      </ExploreTile>
    </li>
  );
  return (
    <>
      {top.length ? (
        <ul className={grid}>
          {own}
          {top.map((r) => tile(r))}
        </ul>
      ) : null}
      {rest.length ? (
        <>
          <div className="mb-3 mt-6 flex items-baseline justify-between border-t border-rule pt-3">
            <span className="typed text-ink-faint">Fits, but none of what you like</span>
            <span className="nums text-xs text-ink-faint">{rows.filter((r) => !r.hits.length).length}</span>
          </div>
          <ul className={grid}>
            {top.length ? null : own}
            {rest.map((r) => tile(r, true))}
          </ul>
        </>
      ) : null}
      {rows.length > TILE_LIMIT ? (
        <button type="button" onClick={() => setAll(!all)} className="mx-auto mt-5 flex w-fit flex-col items-center gap-1 text-ink-soft hover:text-ink">
          <span className="typed">{all ? "Show fewer" : `Show ${rows.length - TILE_LIMIT} more`}</span>
          <ChevronIcon direction="down" size={15} className={cx("transition-transform", all && "rotate-180")} />
        </button>
      ) : null}
    </>
  );
}
