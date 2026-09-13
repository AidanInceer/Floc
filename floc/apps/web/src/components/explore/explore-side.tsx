"use client";

import { formatMoney } from "@floc/core/money/money";
import { SHORTLIST_CAP } from "@floc/core/trip/explore/explore-match";
import type { PresetTrip } from "@floc/core/trip/explore/preset-trips";

import { startTripFromPreset } from "@/app/explore/actions";
import { HeartGlyph, PinGlyph, TickGlyph } from "@/components/explore/explore-glyphs";
import { legLine, skinFor } from "@/components/explore/listing";
import { SubmitButton } from "@/components/system/client-ui";
import { Button, ButtonLink, cx } from "@/components/system/ui";

export function ExploreSide({
  trip,
  saved,
  signedIn,
  busy,
  onToggleSave,
}: {
  trip: PresetTrip;
  saved: string[];
  signedIn: boolean;
  busy: boolean;
  onToggleSave: () => void;
}) {
  return (
    <aside className="flex flex-col gap-4 border-t border-rule p-5 lg:border-l lg:border-t-0">
      <div>
        <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs", skinFor(trip))}>
          <PinGlyph /> {trip.region}
        </span>
        <h2 className="mt-2 text-[23px] leading-tight">{trip.title}</h2>
        <p className="nums mt-1 text-xs text-ink-soft">
          {trip.nights} nights · {trip.groupSize} · {formatMoney(trip.priceFromMinor, trip.currency)} each
        </p>
      </div>

      <ol className="ml-1.5 border-l-[1.5px] border-rule-strong">
        {trip.legs.map((leg, i) => (
          <li
            key={`${leg.place}-${i}`}
            className="relative py-0.5 pb-2 pl-4 text-sm before:absolute before:-left-[5px] before:top-2 before:size-2 before:rounded-full before:border-[1.5px] before:border-ink before:bg-sheet"
          >
            {legLine(leg)}
          </li>
        ))}
      </ol>

      <div className="mt-auto flex gap-2">
        {signedIn ? (
          <form action={startTripFromPreset} className="flex-1">
            <input type="hidden" name="presetId" value={trip.id} />
            <SubmitButton pendingLabel="Starting…" className="w-full">
              Start this trip
            </SubmitButton>
          </form>
        ) : (
          <ButtonLink href="/signup" variant="primary" className="flex-1">
            Sign up to start
          </ButtonLink>
        )}
        <SaveButton trip={trip} saved={saved} signedIn={signedIn} busy={busy} onToggle={onToggleSave} />
      </div>

      <Shortlist count={saved.length} signedIn={signedIn} />
    </aside>
  );
}

function SaveButton({
  trip,
  saved,
  signedIn,
  busy,
  onToggle,
}: {
  trip: PresetTrip;
  saved: string[];
  signedIn: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  if (!signedIn) {
    return (
      <ButtonLink href="/signup">
        <HeartGlyph /> Save
      </ButtonLink>
    );
  }
  const isSaved = saved.includes(trip.id);
  const full = !isSaved && saved.length >= SHORTLIST_CAP;
  return (
    <Button onClick={onToggle} disabled={busy || full} aria-pressed={isSaved}>
      {isSaved ? <TickGlyph /> : <HeartGlyph />}
      {isSaved ? "Saved" : full ? "Full" : "Save"}
    </Button>
  );
}

function Shortlist({ count, signedIn }: { count: number; signedIn: boolean }) {
  const line = !signedIn
    ? "Sign up and we keep three for you."
    : count >= SHORTLIST_CAP
      ? "Full. Unsave one to make room."
      : "Save three and we keep them for you.";
  return (
    <div className="rounded-md bg-mint p-3 text-[13px] text-mint-ink">
      <strong>
        Your shortlist · {count} of {SHORTLIST_CAP}
      </strong>
      <div className="mt-1.5 flex gap-1" aria-hidden>
        {Array.from({ length: SHORTLIST_CAP }, (_, k) => (
          <i key={k} className={cx("h-1.5 w-[22px] rounded-sm", k < count ? "bg-mint-ink" : "bg-mint-edge")} />
        ))}
      </div>
      <p className="mt-1.5">{line}</p>
    </div>
  );
}
