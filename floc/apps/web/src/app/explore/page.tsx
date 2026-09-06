/**
 * /explore — ready-made trip ideas to start from. Listings are static and
 * editorial: no backend, no partner integration, nothing bookable (see
 * docs/partner-trips.html). "Start this trip" seeds a real trip from a
 * listing — see `startTripFromPreset`.
 *
 * Ticket 194 sold a listing by its *shape*. Ticket 213 splits that in two: the
 * first three of the shown set are full-width highlight rows that plot their
 * bases on a real map (`RouteMap`), alternating side to side; the rest fall to
 * compact tiles whose base chain still carries the shape without a map.
 *
 * Public: a signed-out visitor sees the same listings, because the reason to
 * make an account is on this page. Starting a trip needs one, so their button
 * says so and goes to /signup rather than half-starting anything.
 */
import { getSession } from "@/server/access";
import { formatMoney } from "@floc/core/money";
import { ButtonLink, PASTEL_SKINS, cx } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { RouteMap } from "@/components/route-map";
import { startTripFromPreset } from "./actions";
import { PRESET_TRIPS, REGIONS } from "@floc/core/preset-trips";
import type { PresetTrip, Region } from "@floc/core/preset-trips";

function isRegion(value: string | undefined): value is Region {
  return !!value && (REGIONS as readonly string[]).includes(value);
}

// A destination isn't a domain, so no pastel here carries meaning — the
// rotation is `PASTEL_SKINS` by position, which keeps a listing the same colour
// every visit.
function skinFor(t: PresetTrip): string {
  return PASTEL_SKINS[PRESET_TRIPS.indexOf(t) % PASTEL_SKINS.length];
}

/** First sentence of the summary — the rest is detail the group finds later. */
function hook(summary: string): string {
  const end = summary.indexOf(". ");
  return end === -1 ? summary : summary.slice(0, end + 1);
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const session = await getSession();
  const signedIn = !!session?.user;

  const { region } = await searchParams;
  const active = isRegion(region) ? region : null;
  const shown = active
    ? PRESET_TRIPS.filter((t) => t.region === active)
    : PRESET_TRIPS;
  const highlighted = shown.slice(0, 3);
  const rest = shown.slice(3);

  return (
    <div className="mx-auto w-full max-w-[76rem] px-4 pb-20 pt-6 sm:px-6">
      <header>
        <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Explore</h1>
      </header>

      <nav
        aria-label="Filter by region"
        className="mt-8 flex flex-wrap items-center justify-center gap-2"
      >
        <span className="typed mr-1">Region</span>
        <ButtonLink
          href="/explore"
          variant={active ? "secondary" : "primary"}
          aria-current={active ? undefined : "page"}
        >
          Everywhere
        </ButtonLink>
        {REGIONS.map((r) => (
          <ButtonLink
            key={r}
            href={`/explore?region=${encodeURIComponent(r)}`}
            variant={active === r ? "primary" : "secondary"}
            aria-current={active === r ? "page" : undefined}
          >
            {r}
          </ButtonLink>
        ))}
      </nav>

      {highlighted.length > 0 && (
        <ul className="mt-8 flex flex-col gap-4">
          {highlighted.map((t, i) => (
            <HighlightRow
              key={t.id}
              preset={t}
              skin={skinFor(t)}
              flip={i % 2 === 1}
              signedIn={signedIn}
            />
          ))}
        </ul>
      )}

      <ul
        className={cx(
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
          highlighted.length > 0 ? "mt-4" : "mt-8",
        )}
      >
        {rest.map((t) => (
          <PresetTile key={t.id} preset={t} skin={skinFor(t)} signedIn={signedIn} />
        ))}
        <BlankTile empty={shown.length === 0} region={active} signedIn={signedIn} />
      </ul>

      <p className="mt-10 border-t border-rule pt-5 text-xs text-ink-faint">
        These listings are illustrative and not bookable. Operator names are
        placeholders used to show what a listing would look like — Floc has
        no partnership with any of them, and nothing on this page is paid
        placement.
      </p>
    </div>
  );
}

/** The bases of a listing as `RouteMap` stops — pin number matches base order. */
function baseStops(preset: PresetTrip) {
  let no = 0;
  return preset.legs
    .filter((l) => l.kind === "base")
    .map((l) => ({
      no: ++no,
      name: l.place,
      days: l.nights,
      lat: l.lat,
      lng: l.lng,
    }));
}

function HighlightRow({
  preset,
  skin,
  flip,
  signedIn,
}: {
  preset: PresetTrip;
  skin: string;
  flip: boolean;
  signedIn: boolean;
}) {
  return (
    <li
      className={cx(
        "lift flex flex-col gap-6 rounded-lg p-6 sm:p-7 md:flex-row md:items-stretch md:gap-8",
        flip && "md:flex-row-reverse",
        skin,
      )}
    >
      <div className="md:w-[46%]">
        <RouteMap stops={baseStops(preset)} missing={[]} fill />
      </div>
      <div className="flex min-w-0 flex-col md:w-[54%]">
        <p className="typed">
          {preset.region} · {preset.nights} nights
        </p>
        <h2 className="mt-1.5 text-[clamp(1.5rem,2.5vw,2rem)] leading-tight">
          {preset.title}
        </h2>
        <p className="nums mt-1.5 text-xs opacity-70">
          {preset.country} · {preset.groupSize} · {preset.operator}
        </p>
        <p className="mt-3 text-sm opacity-85">{hook(preset.summary)}</p>
        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
          <span className="nums text-sm">
            {formatMoney(preset.priceFromMinor, preset.currency)} each, roughly
          </span>
          {signedIn ? (
            <form
              action={startTripFromPreset}
              className="w-full sm:ml-auto sm:w-auto"
            >
              <input type="hidden" name="presetId" value={preset.id} />
              <SubmitButton
                variant="primary"
                pendingLabel="Starting…"
                className="w-full sm:w-auto"
              >
                Start this trip
              </SubmitButton>
            </form>
          ) : (
            <ButtonLink
              href="/signup"
              variant="primary"
              className="w-full sm:ml-auto sm:w-auto"
            >
              Sign up to start this trip
            </ButtonLink>
          )}
        </div>
      </div>
    </li>
  );
}

function PresetTile({
  preset,
  skin,
  signedIn,
}: {
  preset: PresetTrip;
  skin: string;
  signedIn: boolean;
}) {
  const bases = preset.legs.filter((l) => l.kind === "base");
  return (
    <li className={cx("lift flex flex-col gap-5 rounded-lg p-6", skin)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="typed">{preset.region}</p>
          <h2 className="mt-1 text-2xl leading-tight">{preset.title}</h2>
        </div>
        <span className="nums shrink-0 rounded-full bg-sheet/60 px-2.5 py-1 text-xs">
          {preset.nights} nights
        </span>
      </div>

      {/* The shape, in one line — bases only, hops are the arrows. */}
      <p className="nums flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm opacity-80">
        {bases.map((b, i) => (
          <span key={`${b.place}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <span className="opacity-40">→</span>}
            {b.place}
          </span>
        ))}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <span className="nums text-sm">
          {formatMoney(preset.priceFromMinor, preset.currency)}
          <span className="text-xs opacity-70"> pp</span>
        </span>
        {signedIn ? (
          <form action={startTripFromPreset}>
            <input type="hidden" name="presetId" value={preset.id} />
            <SubmitButton variant="primary" pendingLabel="Starting…">
              Start
            </SubmitButton>
          </form>
        ) : (
          <ButtonLink href="/signup" variant="primary">
            Sign up
          </ButtonLink>
        )}
      </div>
    </li>
  );
}

/**
 * Sits in the grid rather than beside it: a group with nowhere in mind has the
 * same one obvious action as a group taking a listing. When a region filter
 * empties the grid it's the only card left, and says what belongs there.
 */
function BlankTile({
  empty,
  region,
  signedIn,
}: {
  empty: boolean;
  region: Region | null;
  signedIn: boolean;
}) {
  return (
    <li className="lift flex min-h-[13rem] flex-col gap-4 rounded-lg bg-pen-soft p-6 text-pen-deep">
      <div>
        <p className="typed">
          {empty ? `Nothing in ${region} yet` : "Start from nothing"}
        </p>
        <h2 className="mt-1.5 text-2xl">Your own</h2>
        <p className="nums mt-1.5 text-xs opacity-70">Name it now, decide later</p>
      </div>
      <p className="text-sm opacity-85">
        {empty
          ? "Ideas for this region will show up here as they're written. Everywhere else still has plenty."
          : "A trip with no dates and no destination is a normal way to start. Write down what you fancy and see who agrees."}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
        {empty ? (
          <ButtonLink href="/explore" variant="secondary">
            Show everywhere
          </ButtonLink>
        ) : null}
        <ButtonLink
          href={signedIn ? "/trips" : "/signup"}
          variant="primary"
          className="ml-auto"
        >
          {signedIn ? "Start a trip" : "Sign up"}
        </ButtonLink>
      </div>
    </li>
  );
}
