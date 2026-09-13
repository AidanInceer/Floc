import Link from "next/link";
import { formatMoney } from "@floc/core/money/money";
import { REGIONS, type PresetTrip, type Region } from "@floc/core/trip/explore/preset-trips";

import { startTripFromPreset } from "@/app/explore/actions";
import { basePlaces, skinFor } from "@/components/explore/listing";
import { SubmitButton } from "@/components/system/client-ui";
import { ButtonLink, cx } from "@/components/system/ui";

const ROW_LIMIT = 10;

const row =
  "grid grid-cols-[0.6rem_1fr_auto] items-center gap-4 border-b border-rule px-1 py-2.5 hover:bg-sheet md:grid-cols-[0.6rem_1.3fr_2fr_5rem_6rem_auto]";

export function ExploreRows({
  trips,
  region,
  signedIn,
  showAll,
}: {
  trips: PresetTrip[];
  region: Region | null;
  signedIn: boolean;
  showAll: boolean;
}) {
  const shown = showAll ? trips : trips.slice(0, ROW_LIMIT);
  const hidden = trips.length - shown.length;
  const base = region ? `/explore?region=${encodeURIComponent(region)}` : "/explore";
  return (
    <section className="mt-14">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-[clamp(1.5rem,3vw,2.1rem)]">All trips</h2>
        <nav aria-label="Filter by region" className="flex flex-wrap gap-1.5">
          {[null, ...REGIONS].map((r) => (
            <ButtonLink
              key={r ?? "all"}
              href={r ? `/explore?region=${encodeURIComponent(r)}` : "/explore"}
              scroll={false}
              variant={region === r ? "primary" : "secondary"}
              aria-current={region === r ? "page" : undefined}
            >
              {r ?? "Everywhere"}
            </ButtonLink>
          ))}
        </nav>
      </div>

      <ul className="border-t border-rule">
        {shown.map((trip) => (
          <li key={trip.id} className={row}>
            <span aria-hidden className={cx("size-2.5 rounded-full", skinFor(trip))} />
            <h3 className="text-base">{trip.title}</h3>
            <span className="nums hidden truncate text-[12.5px] text-ink-soft md:block">
              {basePlaces(trip).join(" → ")}
            </span>
            <span className="nums hidden text-[13px] md:block">{trip.nights} nights</span>
            <span className="nums hidden text-[13px] md:block">
              {formatMoney(trip.priceFromMinor, trip.currency)} pp
            </span>
            {signedIn ? (
              <form action={startTripFromPreset}>
                <input type="hidden" name="presetId" value={trip.id} />
                <SubmitButton pendingLabel="Starting…">Start</SubmitButton>
              </form>
            ) : (
              <ButtonLink href="/signup" variant="primary">
                Sign up
              </ButtonLink>
            )}
          </li>
        ))}
        <li className={row}>
          <span aria-hidden className="size-2.5 rounded-full border-[1.5px] border-dashed border-pen" />
          <h3 className="text-base text-pen-deep">{trips.length === 0 ? `Nothing in ${region} yet` : "Your own"}</h3>
          <span className="hidden text-[12.5px] text-ink-soft md:block">No dates, no destination. See who agrees.</span>
          <span className="hidden md:block" />
          <span className="hidden md:block" />
          <ButtonLink href={signedIn ? "/trips" : "/signup"}>Start blank</ButtonLink>
        </li>
      </ul>
      {hidden > 0 || trips.length > ROW_LIMIT ? (
        <Link
          href={showAll ? base : `${base}${region ? "&" : "?"}all=1`}
          scroll={false}
          className="mx-auto mt-4 flex w-fit flex-col items-center gap-1 text-ink-soft hover:text-ink"
        >
          <span className="typed">{showAll ? "Show fewer" : `Show ${hidden} more`}</span>
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={showAll ? "m3.5 8.5 3.5-3.5 3.5 3.5" : "m3.5 5.5 3.5 3.5 3.5-3.5"} />
          </svg>
        </Link>
      ) : null}
    </section>
  );
}
