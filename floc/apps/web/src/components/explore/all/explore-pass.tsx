"use client";

import { formatMoney } from "@floc/core/money/money";
import { filterCheck, type ExploreFilter } from "@floc/core/trip/explore/explore-filter";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { startTripFromPreset } from "@/app/explore/actions";
import { tagClass } from "@/components/explore/all/explore-tile";
import { RouteRail } from "@/components/explore/all/route-rail";
import { skinFor } from "@/components/explore/listing";
import { PassMap } from "@/components/explore/outline/pass-map";
import { SubmitButton } from "@/components/system/client-ui";
import { CheckIcon } from "@/components/system/icons";
import { ButtonLink, cx } from "@/components/system/ui";

const label = "font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-faint";
export const missChip = "rounded-full border border-rule-strong px-2 py-px text-[11.5px] text-ink-faint";
// Why: the tear's notches are the page showing through, so they take the colour of what is behind the pass.
const notch = "absolute -top-[9px] size-[18px] rounded-full";

/** One listing in full, as a pass: map, what it is, the route, then a stub with the figures and the two ways on. */
export function ExplorePass({
  trip,
  filter,
  signedIn,
  inSheet = false,
}: {
  trip: PresetTrip;
  filter: ExploreFilter;
  signedIn: boolean;
  /** On a phone the pass is the body of a sheet: no card of its own, and the narrower drawing. */
  inSheet?: boolean;
}) {
  const { fits, misses } = filterCheck(trip, filter);
  const behind = inSheet ? "bg-sheet-3" : "bg-paper";
  return (
    <article className={cx("overflow-hidden bg-sheet", !inSheet && "rounded-[22px] shadow-lifted")}>
      <div className={cx("bg-sheet-2", inSheet ? "aspect-[343/190]" : "aspect-[2/1]")}>
        <PassMap trip={trip} />
      </div>
      <div className="flex flex-col gap-2.5 px-5 pb-[18px] pt-4">
        <span className={cx(tagClass, skinFor(trip))}>{trip.country}</span>
        <h3 className="text-2xl leading-tight tracking-[-0.025em]">{trip.title}</h3>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {fits.map((fit) => (
            <span key={fit} className="inline-flex items-center gap-1 text-xs text-green">
              <CheckIcon size={11} />
              {fit}
            </span>
          ))}
          {misses.map((miss) => (
            <span key={miss} className={missChip}>
              {miss}
            </span>
          ))}
        </p>
        <p className="text-sm text-ink-soft">{trip.summary}</p>
        <RouteRail trip={trip} />
      </div>
      <div aria-hidden className="relative mx-4 border-t-[1.5px] border-dashed border-rule-strong">
        <span className={cx(notch, behind, "-left-[25px]")} />
        <span className={cx(notch, behind, "-right-[25px]")} />
      </div>
      <div className="flex flex-col gap-3.5 px-5 pb-5 pt-4">
        <dl className="grid grid-cols-[auto_auto_1fr] gap-x-6 gap-y-2.5">
          {[
            ["Nights", String(trip.nights)],
            ["Group", trip.groupSize.replace(" people", "")],
            ["Each, from", formatMoney(trip.priceFromMinor, trip.currency)],
          ].map(([name, value]) => (
            <div key={name}>
              <dt className={label}>{name}</dt>
              <dd className="nums text-sm">{value}</dd>
            </div>
          ))}
          <div className="col-span-full">
            <dt className={label}>Best</dt>
            <dd className="text-[13.5px]">{trip.bestMonths}</dd>
          </div>
        </dl>
        <div className={cx("grid gap-2", !inSheet && "grid-cols-2")}>
          <ButtonLink href={`/explore/${trip.id}`} className="w-full">
            See the full trip
          </ButtonLink>
          {signedIn ? (
            <form action={startTripFromPreset}>
              <input type="hidden" name="presetId" value={trip.id} />
              <SubmitButton pendingLabel="Starting…" className="w-full">
                Start this trip
              </SubmitButton>
            </form>
          ) : (
            <ButtonLink href="/signup" variant="primary" className="w-full">
              Sign up to start
            </ButtonLink>
          )}
        </div>
      </div>
    </article>
  );
}
