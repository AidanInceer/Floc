/**
 * /explore — ready-made trip ideas to start from.
 *
 * Deliberately inert: a mockup with no backend, no partner integration and no
 * "copy this into a trip" action wired up. It exists to make the shape of a
 * partner listing arguable before anything is built — see
 * ventures/waypoint/docs/partner-trips.md, which also records the unresolved
 * tension with monetisation.md's rejection of paid placement.
 */
import Link from "next/link";

import { requireUser } from "@/lib/access";
import { formatMoney } from "@/lib/money";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  Page,
  PageHeader,
  Stack,
  cx,
} from "@/components/ui";
import { PRESET_TRIPS, REGIONS } from "./preset-trips";
import type { PresetTrip, Region } from "./preset-trips";

function isRegion(value: string | undefined): value is Region {
  return !!value && (REGIONS as readonly string[]).includes(value);
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  await requireUser("/explore");

  // Filtering is a plain link + searchParams rather than client state: the list
  // is static, so there's nothing here worth shipping JavaScript for.
  const { region } = await searchParams;
  const active = isRegion(region) ? region : null;
  const shown = active
    ? PRESET_TRIPS.filter((t) => t.region === active)
    : PRESET_TRIPS;

  return (
    <Page wide>
      <PageHeader
        title="Explore"
        subtitle="Trip ideas to start from — itineraries someone has already thought through, so the group has something to argue with."
      />

      <nav aria-label="Filter by region" className="mb-5 flex flex-wrap gap-1.5">
        <FilterChip label="Everywhere" href="/explore" active={!active} />
        {REGIONS.map((r) => (
          <FilterChip
            key={r}
            label={r}
            href={`/explore?region=${encodeURIComponent(r)}`}
            active={active === r}
          />
        ))}
      </nav>

      {shown.length === 0 ? (
        <EmptyState title="Nothing here yet">
          No ideas for that region at the moment. Try everywhere.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <PresetCard key={t.id} preset={t} />
          ))}
        </ul>
      )}

      <p className="mt-8 border-t border-rule pt-4 text-xs text-ink-faint">
        These listings are illustrative and not bookable. Operator names are
        placeholders used to show what a listing would look like — Waypoint has
        no partnership with any of them, and nothing on this page is paid
        placement.
      </p>
    </Page>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "rounded-sm border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
        active
          ? "border-pen bg-pen text-sheet"
          : "border-rule-strong bg-sheet text-ink-soft hover:bg-sheet-2",
      )}
    >
      {label}
    </Link>
  );
}

function PresetCard({ preset }: { preset: PresetTrip }) {
  return (
    <Card as="li" className="flex flex-col">
      <div className="border-b border-dotted border-rule-strong px-4 py-3">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={preset.editorial ? "marine" : "neutral"}>
            {preset.operator}
          </Badge>
          <Badge tone="neutral">{preset.country}</Badge>
        </div>
        <h2 className="typed">{preset.title}</h2>
        <p className="mt-0.5 font-mono text-xs text-ink-faint">
          {preset.nights} nights · {preset.groupSize} · from{" "}
          {formatMoney(preset.priceFromMinor, preset.currency)} each
        </p>
      </div>

      <div className="flex flex-1 flex-col px-4 py-3">
        <Stack gap={3} className="flex-1">
          <p className="text-sm text-ink-soft">{preset.summary}</p>
          <ul className="flex flex-col gap-1 text-sm text-ink-soft">
            {preset.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <span aria-hidden className="text-ink-faint">
                  —
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-faint">Best months: {preset.bestMonths}</p>
        </Stack>

        {/* Goes to /trips, not to a copy action: nothing seeds a trip from a
            preset yet, and a button that pretends otherwise would be worse
            than an honest one. */}
        <div className="mt-4">
          <ButtonLink
            href="/trips"
            variant="secondary"
            title="Preview only — starting a trip from a preset isn't built yet"
          >
            Start a trip from this
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
