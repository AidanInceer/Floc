/**
 * /explore — ready-made trip ideas to start from. Listings are static and
 * editorial: no backend, no partner integration, nothing bookable (see
 * docs/partner-trips.html). "Start this trip" seeds a real trip from a
 * listing — see `startTripFromPreset`.
 *
 * Ticket 194: a listing sells its *shape* — bases, nights, the hops between —
 * not a photograph. The page carries no imagery at all, so the map thumbnail
 * went; `lat`/`lng` stay on the data for whatever wants them next.
 */
import { requireUser } from "@/server/access";
import { formatMoney } from "@/lib/money";
import { ButtonLink, PASTEL_SKINS, cx } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { TravelModeIcon } from "@/components/travel-mode-icon";
import { startTripFromPreset } from "./actions";
import { PRESET_TRIPS, REGIONS } from "./preset-trips";
import type { PresetTrip, Region } from "./preset-trips";

function isRegion(value: string | undefined): value is Region {
  return !!value && (REGIONS as readonly string[]).includes(value);
}

// A destination isn't a domain, so no pastel here carries meaning — the
// rotation is `PASTEL_SKINS` by position, which keeps a listing the same colour
// every visit.
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  await requireUser("/explore");

  const { region } = await searchParams;
  const active = isRegion(region) ? region : null;
  const shown = active
    ? PRESET_TRIPS.filter((t) => t.region === active)
    : PRESET_TRIPS;

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <header>
        <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Explore</h1>
      </header>

      <nav
        aria-label="Filter by region"
        className="mt-8 flex flex-wrap items-center gap-2"
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

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <PresetCard
            key={t.id}
            preset={t}
            skin={PASTEL_SKINS[PRESET_TRIPS.indexOf(t) % PASTEL_SKINS.length]}
          />
        ))}
        <BlankTile empty={shown.length === 0} region={active} />
      </ul>

      <p className="mt-10 border-t border-rule pt-5 text-xs text-ink-faint">
        These listings are illustrative and not bookable. Operator names are
        placeholders used to show what a listing would look like — Waypoint has
        no partnership with any of them, and nothing on this page is paid
        placement.
      </p>
    </div>
  );
}

/** The bed a base is measured in — 14×14 line art, like the rest (#148). */
function StayIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="shrink-0"
      style={{ width: 13, height: 13 }}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.15}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 10.5V3.5M1.5 7.5h11v3M12.5 10.5v-3" />
      <circle cx="4.2" cy="5.6" r="1.2" />
      <path d="M6.4 7.5v-1.1a.9.9 0 0 1 .9-.9h4a1.2 1.2 0 0 1 1.2 1.2v.8" />
    </svg>
  );
}

function PresetCard({ preset, skin }: { preset: PresetTrip; skin: string }) {
  const bases = preset.legs.filter((l) => l.kind === "base").length;
  return (
    <li
      className={cx(
        "lift flex min-h-[19rem] flex-col gap-4 rounded-lg p-6",
        skin,
      )}
    >
      <div>
        <p className="typed">
          {preset.nights} nights · {bases === 1 ? "one base" : `${bases} bases`}{" "}
          · {preset.region}
        </p>
        <h2 className="mt-1.5 text-2xl">{preset.title}</h2>
        <p className="nums mt-1.5 text-xs opacity-70">
          {preset.country} · {preset.groupSize} · {preset.operator}
        </p>
      </div>

      <p className="text-sm opacity-85">{preset.summary}</p>

      {/* The shape of the trip, in order — this is the picture (ticket 194). */}
      <ul className="mt-auto flex flex-col gap-1.5">
        {preset.legs.map((leg, i) => (
          <li
            key={`${leg.kind}-${leg.place}-${i}`}
            className={cx(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm",
              leg.kind === "base" ? "bg-sheet/65" : "bg-sheet/30",
            )}
          >
            {leg.kind === "base" ? (
              <StayIcon />
            ) : (
              <TravelModeIcon mode={leg.mode} />
            )}
            <span className="min-w-0 truncate">{leg.place}</span>
            <span className="nums ml-auto shrink-0 text-xs opacity-70">
              {leg.kind === "base"
                ? leg.nights === 1
                  ? "1 night"
                  : `${leg.nights} nights`
                : leg.detail}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
        <span className="nums text-xs opacity-75">
          {formatMoney(preset.priceFromMinor, preset.currency)} each, roughly
        </span>
        <form action={startTripFromPreset} className="ml-auto">
          <input type="hidden" name="presetId" value={preset.id} />
          <SubmitButton variant="primary" pendingLabel="Starting…">
            Start this trip
          </SubmitButton>
        </form>
      </div>
    </li>
  );
}

/**
 * Sits in the grid rather than beside it: a group with nowhere in mind has the
 * same one obvious action as a group taking a listing. When a region filter
 * empties the grid it's the only card left, and says what belongs there.
 */
function BlankTile({ empty, region }: { empty: boolean; region: Region | null }) {
  return (
    <li className="lift flex min-h-[19rem] flex-col gap-4 rounded-lg bg-pen-soft p-6 text-pen-deep">
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
          : "A trip with no dates and no destination is a normal way to start. Pin a few ideas and let the group vote."}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
        {empty ? (
          <ButtonLink href="/explore" variant="secondary">
            Show everywhere
          </ButtonLink>
        ) : null}
        <ButtonLink href="/trips" variant="primary" className="ml-auto">
          Start a trip
        </ButtonLink>
      </div>
    </li>
  );
}
