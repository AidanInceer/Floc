/**
 * Packing tab (ticket 219, extended by 220). Layout B — the group's gear on
 * top, your own bag underneath, both full-width, so the page reads the same
 * top-to-bottom on a phone as on a desk.
 */
import { requireTripAccess } from "@/server/access";
import { getPackTier } from "@/server/membership";
import {
  autoFillPersonalBag,
  packingPlanFor,
} from "@/server/packing-generator";
import {
  listPackingClaims,
  listPackingLines,
  listPersonalPackingLines,
} from "@/server/packing";
import { ensureProfile } from "@/server/profile";
import {
  PACK_CATEGORY_LABELS,
  PACK_SORTS,
  PACK_TIERS,
  PACK_TIER_LABELS,
  parseCategoryFilter,
  parsePackSort,
  resolvePackTier,
  viewPackingLines,
} from "@/lib/packing";
import type { PackCategory, PackSort } from "@/lib/packing";
import {
  CategorySelect,
  PackingBulkBar,
  PackingListFilters,
} from "@/components/packing-controls";
import Link from "next/link";
import type { ReactNode } from "react";
import { cx, EmptyState } from "@/components/ui";
import { pillOff, pillOn, pillShape } from "@/components/account-ui";
import { SubmitButton } from "@/components/client-ui";
import { PackingLineRow } from "@/components/packing-line-row";
import { PersonalPackingRow } from "@/components/packing-personal-row";
import type { PackingClaimant } from "@/components/packing-line-row";
import {
  addPackingLine,
  addPersonalPackingLine,
  removePackingLine,
  setPackingClaim,
  setPackingPacked,
  setPersonalPackingPacked,
  stepPersonalPackingQuantity,
  setTripPackTier,
  fillMyPackingList,
  removePackingLines,
  resetPackingList,
} from "./actions";

/** The shared list shows no count, so ordering by one would sort by something invisible. */
const SHARED_SORTS: readonly PackSort[] = ["category", "name"];

type View = { sort: PackSort; category: PackCategory | "all" };

/**
 * One control changes, the rest stay put — a filter and a sort that reset each
 * other are two controls fighting. Both lists' views live in one query string,
 * prefixed, so ordering your bag never reorders the group's.
 */
function hrefBuilder(
  path: string,
  prefix: "shared" | "bag",
  mine: View,
  other: Record<string, string>,
) {
  return (patch: { sort?: PackSort; category?: PackCategory | "all" }) => {
    const next = new URLSearchParams(other);
    const sort = patch.sort ?? mine.sort;
    const category = patch.category ?? mine.category;
    if (sort !== "category") next.set(`${prefix}Sort`, sort);
    if (category !== "all") next.set(`${prefix}Cat`, category);
    const query = next.toString();
    return query ? `${path}?${query}` : path;
  };
}

export default async function PackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const access = await requireTripAccess(id, `/trip/${id}/packing`);
  const tripId = access.trip.id;

  const [lines, claims, perTripTier, profile, plan] = await Promise.all([
    listPackingLines(tripId),
    listPackingClaims(tripId),
    getPackTier(tripId, access.viewer.id),
    ensureProfile(access.viewer.id),
    packingPlanFor(access.trip),
  ]);

  const tier = resolvePackTier(perTripTier, profile.packTier);

  const path = `/trip/${tripId}/packing`;
  const sharedView: View = {
    sort: parsePackSort(query.sharedSort, SHARED_SORTS),
    category: parseCategoryFilter(query.sharedCat),
  };
  const bagView: View = {
    sort: parsePackSort(query.bagSort, PACK_SORTS),
    category: parseCategoryFilter(query.bagCat),
  };
  // Each list keeps the other's controls in the query string, so ordering your
  // bag never quietly reorders the group's.
  const keep = (prefix: "shared" | "bag", view: View) =>
    Object.fromEntries(
      [
        view.sort !== "category" ? [`${prefix}Sort`, view.sort] : null,
        view.category !== "all" ? [`${prefix}Cat`, view.category] : null,
      ].filter((e): e is [string, string] => e !== null),
    );

  const sharedGroups = viewPackingLines(lines, sharedView);

  // Seeded here rather than behind a button because that's what the profile
  // setting asks for (ticket 221). Safe on every render: the fill claims a
  // one-shot flag on the membership in the same transaction as the insert, so a
  // bag is only ever auto-filled once — emptying yours does not invite it back.
  // A prefetch can't trigger it either: the tab renders behind `loading.tsx`,
  // which is as far as Next prefetches a dynamic segment.
  if (profile.packAutoGenerate) {
    await autoFillPersonalBag({
      tripId,
      ownerId: access.viewer.id,
      tier,
      plan,
    });
  }

  const mine = await listPersonalPackingLines(tripId, access.viewer.id);
  const bagGroups = viewPackingLines(mine, bagView);

  // One person, one avatar colour across every tab.
  const toneOf = new Map(access.members.map((m) => [m.userId, m.tone]));

  const claimsByLine = new Map<number, PackingClaimant[]>();
  for (const c of claims) {
    const list = claimsByLine.get(c.packingLineId) ?? [];
    list.push({
      userId: c.userId,
      name: c.name,
      avatarUrl: c.avatarUrl,
      tone: toneOf.get(c.userId),
      packedAt: c.packedAt,
    });
    claimsByLine.set(c.packingLineId, list);
  }

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Packing</h1>

      <section className="mt-8">
        <h2 className="typed">Shared</h2>

        <form
          action={addPackingLine.bind(null, tripId)}
          className="mt-3 flex flex-wrap items-center gap-3"
        >
          <label className="min-w-[16rem] flex-1">
            <span className="sr-only">Add something to pack</span>
            <input
              name="label"
              required
              maxLength={200}
              placeholder="Something to pack…"
              className="w-full rounded-md border border-rule-strong bg-sheet px-4 py-2.5 text-sm placeholder:text-ink-faint focus-visible:border-pen"
            />
          </label>
          <CategorySelect />
          <SubmitButton pendingLabel="Adding…">Add to the list</SubmitButton>
        </form>

        {lines.length > 0 ? (
          <>
            <PackingListFilters
              hrefFor={hrefBuilder(path, "shared", sharedView, keep("bag", bagView))}
              sort={sharedView.sort}
              category={sharedView.category}
              sorts={SHARED_SORTS}
            />
            {/* Gated on what's on screen, not on what the list holds: a bar
                offering to clear rows a filter is hiding is one press from
                losing something you can't see. */}
            {sharedGroups.length > 0 ? (
              <PackingBulkBar
                formId="shared-bulk"
                removeSelected={removePackingLines.bind(null, tripId)}
                reset={resetPackingList.bind(null, tripId, false)}
                resetMessage="Clear the whole shared list for everyone — including anything a filter is hiding?"
              />
            ) : null}
          </>
        ) : null}

        <div className="mt-4 space-y-6">
          {lines.length === 0 ? (
            <EmptyState title="No shared packing yet.">
              The gear one of you brings for everyone — a speaker, a kettle, the
              first-aid kit.
            </EmptyState>
          ) : sharedGroups.length === 0 ? (
            <EmptyState title="Nothing in that category.">
              The shared list has lines, just none filed here.
            </EmptyState>
          ) : (
            sharedGroups.map((group) => (
              <ListGroup key={group.category ?? "flat"} category={group.category}>
                {group.lines.map((line) => (
                  <PackingLineRow
                    key={line.id}
                    tripId={tripId}
                    lineId={line.id}
                    label={line.label}
                    selectFormId="shared-bulk"
                    claimants={claimsByLine.get(line.id) ?? []}
                    viewerId={access.viewer.id}
                    setClaim={setPackingClaim}
                    setPacked={setPackingPacked}
                    remove={removePackingLine}
                  />
                ))}
              </ListGroup>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="typed">Your bag</h2>

        {/* Each pill is its own submit — picking a tier is the whole
            interaction, so there is nothing left for a Save button to do. */}
        <form
          action={setTripPackTier.bind(null, tripId)}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          {PACK_TIERS.map((t) => (
            <button
              key={t}
              type="submit"
              name="packTier"
              value={t}
              aria-pressed={t === tier}
              className={cx(
                pillShape,
                t === tier ? pillOn : pillOff,
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pen",
              )}
            >
              {PACK_TIER_LABELS[t]}
            </button>
          ))}
        </form>

        {/* The generator's own row: what it couldn't know, then the one button
            that acts on what it could. Additive, so the label promises a top-up
            rather than a rebuild — pressing it never costs you an edit. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <form action={fillMyPackingList.bind(null, tripId)}>
            <SubmitButton variant="ghost" pendingLabel="Working it out…">
              Suggest what to pack
            </SubmitButton>
          </form>

          {plan.gap === "no-dates" ? (
            <p className="text-sm text-ink-soft">
              <Link href={`/trip/${tripId}/dates`} className="underline">
                Set your dates
              </Link>{" "}
              for a list that knows how long you&rsquo;re away.
            </p>
          ) : plan.gap === "no-place" ? (
            <p className="text-sm text-ink-soft">
              <Link href={`/trip/${tripId}/days`} className="underline">
                Add where you&rsquo;re staying
              </Link>{" "}
              and the list can pack for the weather too.
            </p>
          ) : plan.gap === "no-forecast" ? (
            <p className="text-sm text-ink-soft">
              No forecast this far out, so the list doesn&rsquo;t guess at the
              weather.
            </p>
          ) : null}
        </div>

        <form
          action={addPersonalPackingLine.bind(null, tripId)}
          className="mt-4 flex flex-wrap items-center gap-3"
        >
          <label className="min-w-[16rem] flex-1">
            <span className="sr-only">Add something to your bag</span>
            <input
              name="label"
              required
              maxLength={200}
              placeholder="Something to pack…"
              className="w-full rounded-md border border-rule-strong bg-sheet px-4 py-2.5 text-sm placeholder:text-ink-faint focus-visible:border-pen"
            />
          </label>
          <CategorySelect />
          <SubmitButton pendingLabel="Adding…">Add to my bag</SubmitButton>
        </form>

        {mine.length > 0 ? (
          <>
            <PackingListFilters
              hrefFor={hrefBuilder(path, "bag", bagView, keep("shared", sharedView))}
              sort={bagView.sort}
              category={bagView.category}
              sorts={PACK_SORTS}
            />
            {bagGroups.length > 0 ? (
              <PackingBulkBar
                formId="bag-bulk"
                removeSelected={removePackingLines.bind(null, tripId)}
                reset={resetPackingList.bind(null, tripId, true)}
                resetMessage="Clear your whole bag, including anything a filter is hiding? The shared list stays."
              />
            ) : null}
          </>
        ) : null}

        <div className="mt-4 space-y-6">
          {mine.length === 0 ? (
            <EmptyState title="Your bag’s empty.">
              Only you can see this list.
            </EmptyState>
          ) : bagGroups.length === 0 ? (
            <EmptyState title="Nothing in that category.">
              Your bag has lines, just none filed here.
            </EmptyState>
          ) : (
            bagGroups.map((group) => (
              <ListGroup key={group.category ?? "flat"} category={group.category}>
                {group.lines.map((line) => (
                  <PersonalPackingRow
                    key={line.id}
                    tripId={tripId}
                    lineId={line.id}
                    label={line.label}
                    selectFormId="bag-bulk"
                    quantity={line.quantity}
                    packedAt={line.packedAt}
                    setPacked={setPersonalPackingPacked}
                    step={stepPersonalPackingQuantity}
                    remove={removePackingLine}
                  />
                ))}
              </ListGroup>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

/** A category heading over its own list. No heading when the list is flat — see `viewPackingLines`. */
function ListGroup({
  category,
  children,
}: {
  category: PackCategory | null;
  children: ReactNode;
}) {
  return (
    <div>
      {category ? (
        <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
          {PACK_CATEGORY_LABELS[category]}
        </h3>
      ) : null}
      <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-sheet">
        {children}
      </ul>
    </div>
  );
}
