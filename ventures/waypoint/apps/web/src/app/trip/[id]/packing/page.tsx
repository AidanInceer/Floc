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
import { listPackingKits } from "@/server/packing-kits";
import { ensureProfile } from "@/server/profile";
import {
  PACK_SORTS,
  PACK_TIERS,
  PACK_TIER_LABELS,
  packingStatus,
  parseCategoryFilter,
  parsePackSort,
  resolvePackTier,
  viewPackingLines,
} from "@/lib/packing";
import type { PackCategory, PackSort } from "@/lib/packing";
import {
  CategorySelect,
  PackingBulkBar,
  PackingKitMenu,
  PackingListFilters,
} from "@/components/packing-controls";
import {
  PackingCard,
  PackingCardEmpty,
  PackingCount,
  PackingGroup,
  SegmentedField,
  segmentOff,
  segmentOn,
  segmentShape,
} from "@/components/packing-card";
import Link from "next/link";
import { cx } from "@/components/ui";
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
  applyPackingKit,
} from "./actions";

/** The shared list shows no count, so ordering by one would sort by something invisible. */
const SHARED_SORTS: readonly PackSort[] = ["category", "name"];

type View = {
  sort: PackSort;
  category: PackCategory | "all";
  /** Tick boxes on the rows — a mode, so a list you are only reading stays clean. */
  select: boolean;
};

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
  return (patch: {
    sort?: PackSort;
    category?: PackCategory | "all";
    select?: boolean;
  }) => {
    const next = new URLSearchParams(other);
    const sort = patch.sort ?? mine.sort;
    const category = patch.category ?? mine.category;
    const select = patch.select ?? mine.select;
    if (sort !== "category") next.set(`${prefix}Sort`, sort);
    if (category !== "all") next.set(`${prefix}Cat`, category);
    if (select) next.set(`${prefix}Pick`, "1");
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

  const [lines, claims, perTripTier, profile, plan, kits] = await Promise.all([
    listPackingLines(tripId),
    listPackingClaims(tripId),
    getPackTier(tripId, access.viewer.id),
    ensureProfile(access.viewer.id),
    packingPlanFor(access.trip),
    listPackingKits(access.viewer.id),
  ]);

  const tier = resolvePackTier(perTripTier, profile.packTier);

  const path = `/trip/${tripId}/packing`;
  const sharedView: View = {
    sort: parsePackSort(query.sharedSort, SHARED_SORTS),
    category: parseCategoryFilter(query.sharedCat),
    select: query.sharedPick === "1",
  };
  const bagView: View = {
    sort: parsePackSort(query.bagSort, PACK_SORTS),
    category: parseCategoryFilter(query.bagCat),
    select: query.bagPick === "1",
  };
  // Each list keeps the other's controls in the query string, so ordering your
  // bag never quietly reorders the group's.
  const keep = (prefix: "shared" | "bag", view: View) =>
    Object.fromEntries(
      [
        view.sort !== "category" ? [`${prefix}Sort`, view.sort] : null,
        view.category !== "all" ? [`${prefix}Cat`, view.category] : null,
        view.select ? [`${prefix}Pick`, "1"] : null,
      ].filter((e): e is [string, string] => e !== null),
    );

  const sharedGroups = viewPackingLines(lines, sharedView);
  const sharedHref = hrefBuilder(path, "shared", sharedView, keep("bag", bagView));

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
  const bagHref = hrefBuilder(path, "bag", bagView, keep("shared", sharedView));

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

  const sharedPacked = lines.filter(
    (l) => packingStatus(claimsByLine.get(l.id) ?? []) === "packed",
  ).length;
  const bagPacked = mine.filter((l) => l.packedAt !== null).length;

  const addBox = (label: string) => (
    <label className="min-w-[14rem] flex-1">
      <span className="sr-only">{label}</span>
      <input
        name="label"
        required
        maxLength={200}
        placeholder="Something to pack…"
        className="w-full rounded-md border border-rule bg-sheet px-4 py-2.5 text-sm placeholder:text-ink-faint focus-visible:border-pen"
      />
    </label>
  );

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <h1 className="text-[clamp(1.9rem,4vw,2.8rem)]">Packing</h1>

      {/* Above both lists because it governs one of them and explains the other
          (ticket 229): the tier is how much you like to take, and the button is
          the only thing that reads it. Side by side, that link is visible. */}
      <section className="mt-6 rounded-xl border border-rule bg-sheet px-4 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <h2 className="typed !mb-0">How you pack</h2>

          {/* Each segment is its own submit — picking a tier is the whole
              interaction, so there is nothing left for a Save button. */}
          <form action={setTripPackTier.bind(null, tripId)}>
            <SegmentedField>
              {PACK_TIERS.map((t) => (
                <button
                  key={t}
                  type="submit"
                  name="packTier"
                  value={t}
                  aria-pressed={t === tier}
                  className={cx(
                    segmentShape,
                    t === tier ? segmentOn : segmentOff,
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pen",
                  )}
                >
                  {PACK_TIER_LABELS[t]}
                </button>
              ))}
            </SegmentedField>
          </form>

          {/* Additive, so the label promises a top-up rather than a rebuild —
              pressing it never costs you an edit. */}
          <form action={fillMyPackingList.bind(null, tripId)} className="ml-auto">
            <SubmitButton pendingLabel="Working it out…">
              Fill my bag at this level
            </SubmitButton>
          </form>
        </div>

        <p className="mt-2 max-w-prose text-sm text-ink-soft">
          {plan.gap === "no-dates" ? (
            <>
              <Link href={`/trip/${tripId}/dates`} className="underline">
                Set your dates
              </Link>{" "}
              and the suggestions know how long you&rsquo;re away.
            </>
          ) : plan.gap === "no-place" ? (
            <>
              <Link href={`/trip/${tripId}/days`} className="underline">
                Add where you&rsquo;re staying
              </Link>{" "}
              and they can pack for the weather too.
            </>
          ) : plan.gap === "no-forecast" ? (
            <>No forecast this far out, so the weather is left out of it.</>
          ) : (
            <>
              {plan.nights} night{plan.nights === 1 ? "" : "s"} of suggestions,
              sized to this level. Nothing you already have is touched.
            </>
          )}
        </p>
      </section>

      <section>
        <PackingCard
          header={
            <>
              <h2 className="typed !mb-0">Shared</h2>
              <PackingCount total={lines.length} packed={sharedPacked} />
              {lines.length > 0 ? (
                <PackingListFilters
                  hrefFor={sharedHref}
                  sort={sharedView.sort}
                  category={sharedView.category}
                  sorts={SHARED_SORTS}
                />
              ) : null}
            </>
          }
          tools={
            <form
              action={addPackingLine.bind(null, tripId)}
              className="flex min-w-0 flex-1 flex-wrap items-center gap-3"
            >
              {addBox("Add something to pack")}
              <CategorySelect />
              <SubmitButton pendingLabel="Adding…">Add to the list</SubmitButton>
            </form>
          }
          footer={
            sharedGroups.length > 0 ? (
              /* Gated on what's on screen, not on what the list holds: a bar
                 offering to clear rows a filter is hiding is one press from
                 losing something you can't see. */
              <PackingBulkBar
                formId="shared-bulk"
                selecting={sharedView.select}
                selectHref={sharedHref({ select: true })}
                doneHref={sharedHref({ select: false })}
                removeSelected={removePackingLines.bind(null, tripId)}
                reset={resetPackingList.bind(null, tripId, false)}
                resetMessage="Clear the whole shared list for everyone — including anything a filter is hiding?"
              />
            ) : undefined
          }
        >
          {lines.length === 0 ? (
            <PackingCardEmpty title="No shared packing yet.">
              The gear one of you brings for everyone — a speaker, a kettle, the
              first-aid kit.
            </PackingCardEmpty>
          ) : sharedGroups.length === 0 ? (
            <PackingCardEmpty title="Nothing in that category.">
              The shared list has lines, just none filed here.
            </PackingCardEmpty>
          ) : (
            sharedGroups.map((group) => (
              <PackingGroup
                key={group.key}
                heading={group.heading}
                count={group.lines.length}
                pinned={sharedView.select}
              >
                {group.lines.map((line) => (
                  <PackingLineRow
                    key={line.id}
                    tripId={tripId}
                    lineId={line.id}
                    label={line.label}
                    selectFormId={sharedView.select ? "shared-bulk" : null}
                    claimants={claimsByLine.get(line.id) ?? []}
                    viewerId={access.viewer.id}
                    setClaim={setPackingClaim}
                    setPacked={setPackingPacked}
                    remove={removePackingLine}
                  />
                ))}
              </PackingGroup>
            ))
          )}
        </PackingCard>
      </section>

      <section>
        <PackingCard
          header={
            <>
              <h2 className="typed !mb-0">Your bag</h2>
              <PackingCount total={mine.length} packed={bagPacked} />

              {mine.length > 0 ? (
                <PackingListFilters
                  hrefFor={bagHref}
                  sort={bagView.sort}
                  category={bagView.category}
                  sorts={PACK_SORTS}
                />
              ) : null}
            </>
          }
          tools={
            <>
              <form
                action={addPersonalPackingLine.bind(null, tripId)}
                className="flex min-w-0 flex-1 flex-wrap items-center gap-3"
              >
                {addBox("Add something to your bag")}
                <CategorySelect />
                <SubmitButton pendingLabel="Adding…">Add to my bag</SubmitButton>
              </form>

              <PackingKitMenu
                kits={kits}
                apply={applyPackingKit.bind(null, tripId)}
              />
            </>
          }
          footer={
            bagGroups.length > 0 ? (
              <PackingBulkBar
                formId="bag-bulk"
                selecting={bagView.select}
                selectHref={bagHref({ select: true })}
                doneHref={bagHref({ select: false })}
                removeSelected={removePackingLines.bind(null, tripId)}
                reset={resetPackingList.bind(null, tripId, true)}
                resetMessage="Clear your whole bag, including anything a filter is hiding? The shared list stays."
              />
            ) : undefined
          }
        >
          {mine.length === 0 ? (
            <PackingCardEmpty title="Your bag’s empty.">
              Only you can see this list.
            </PackingCardEmpty>
          ) : bagGroups.length === 0 ? (
            <PackingCardEmpty title="Nothing in that category.">
              Your bag has lines, just none filed here.
            </PackingCardEmpty>
          ) : (
            bagGroups.map((group) => (
              <PackingGroup
                key={group.key}
                heading={group.heading}
                count={group.lines.length}
                pinned={bagView.select}
              >
                {group.lines.map((line) => (
                  <PersonalPackingRow
                    key={line.id}
                    tripId={tripId}
                    lineId={line.id}
                    label={line.label}
                    selectFormId={bagView.select ? "bag-bulk" : null}
                    quantity={line.quantity}
                    packedAt={line.packedAt}
                    setPacked={setPersonalPackingPacked}
                    step={stepPersonalPackingQuantity}
                    remove={removePackingLine}
                  />
                ))}
              </PackingGroup>
            ))
          )}
        </PackingCard>
      </section>
    </div>
  );
}
