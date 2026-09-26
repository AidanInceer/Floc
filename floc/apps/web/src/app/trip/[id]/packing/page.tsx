import { requireTripAccess } from "@/server/access";
import { canUseFeature } from "@/server/billing/entitlements";
import { getPackSettings } from "@/server/packing/packing";
import {
  autoFillPersonalBag,
  packingPlanFor,
} from "@/server/packing/packing-generator";
import {
  listPackingClaims,
  listPackingLines,
  listPersonalPackingLines,
} from "@/server/packing/packing";
import { listPackingKits } from "@/server/packing/packing-kits";
import { ensureProfile } from "@/server/auth/profile";
import {
  PACK_TIERS,
  PACK_TIER_LABELS,
  packingStatus,
  resolvePackTier,
  viewPackingLines,
} from "@floc/core/packing/packing";
import { arrangePackingLanes } from "@floc/core/packing/packing-lanes";
import {
  CategorySelect,
  PackingBulkBar,
  PackingKitMenu,
} from "@/components/packing/packing-controls";
import {
  PackingCount,
  SegmentedField,
  segmentOff,
  segmentOn,
  segmentShape,
} from "@/components/packing/packing-card";
import { PackingCube } from "@/components/packing/packing-cube";
import { PackingLane } from "@/components/packing/packing-lane";
import { PackingClaimCard } from "@/components/packing/packing-claim-card";
import Link from "next/link";
import { Avatar, cx, PageTitle } from "@/components/system/ui";
import { SubmitButton } from "@/components/system/client-ui";
import { PersonalPackingRow } from "@/components/packing/packing-personal-row";
import type { PackingClaimant } from "@/components/packing/packing-claim-card";
import {
  addPackingLine,
  addPersonalPackingLine,
  removePackingLine,
  renamePackingLine,
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

export const metadata = { title: "Packing" };

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

  const [lines, claims, packSettings, profile, plan, kits, bag, packingPro] =
    await Promise.all([
      listPackingLines(tripId),
      listPackingClaims(tripId),
      getPackSettings(tripId, access.viewer.id),
      ensureProfile(access.viewer.id),
      packingPlanFor(access.trip),
      listPackingKits(access.viewer.id),
      listPersonalPackingLines(tripId, access.viewer.id),
      canUseFeature("packing.autoGenerate", tripId),
    ]);

  const tier = resolvePackTier(packSettings.tier, profile.packTier);

  const path = `/trip/${tripId}/packing`;
  const sharedSelecting = query.sharedPick === "1";
  const bagSelecting = query.bagPick === "1";
  const selectHref = (bag: boolean, select: boolean) => {
    const next = new URLSearchParams();
    if (bag ? select : bagSelecting) next.set("bagPick", "1");
    if (bag ? sharedSelecting : select) next.set("sharedPick", "1");
    const suffix = next.toString();
    return suffix ? `${path}?${suffix}` : path;
  };

  // Seeded here rather than behind a button because that's what the profile
  // setting asks for (ticket 221). The flag is the fill's own one-shot mark,
  // claimed in the same transaction as the insert, so emptying your bag does not
  // invite it back; reading it here rather than letting the fill no-op keeps a
  // write transaction off the critical path of every press (ticket 231). A
  // prefetch can't trigger it either: the tab renders behind `loading.tsx`,
  // which is as far as Next prefetches a dynamic segment.
  let mine = bag;
  if (
    packingPro &&
    profile.packAutoGenerate &&
    packSettings.generatedAt === null
  ) {
    await autoFillPersonalBag({
      tripId,
      ownerId: access.viewer.id,
      tier,
      plan,
    });
    // Re-read whether or not this call added anything: losing the write lock to
    // the request that filled the bag also reports zero, and rendering `bag`
    // then shows an empty bag next to a full one.
    mine = await listPersonalPackingLines(tripId, access.viewer.id);
  }

  const bagGroups = viewPackingLines(mine, { sort: "category", category: "all" });

  // One person, one avatar colour across every tab.
  const toneOf = new Map(access.members.map((m) => [m.userId, m.tone]));

  const claimsByLine = new Map<number, PackingClaimant[]>();
  for (const c of claims) {
    const list = claimsByLine.get(c.packingLineId) ?? [];
    list.push({
      userId: c.userId,
      name: c.name,
      avatarIcon: c.avatarIcon,
      tone: toneOf.get(c.userId),
      packedAt: c.packedAt,
    });
    claimsByLine.set(c.packingLineId, list);
  }

  const sharedPacked = lines.filter(
    (l) => packingStatus(claimsByLine.get(l.id) ?? []) === "packed",
  ).length;
  const bagPacked = mine.filter((l) => l.packedAt !== null).length;
  const sharedItems = lines.map((line) => ({
    ...line,
    claims: claimsByLine.get(line.id) ?? [],
  }));
  const lanes = arrangePackingLanes(sharedItems, access.members);
  const memberIds = new Set(access.members.map((member) => member.userId));
  const cardActions = {
    claim: setPackingClaim,
    pack: setPackingPacked,
    remove: removePackingLine,
    rename: renamePackingLine,
  };

  const addBox = (label: string, fullWidth = false) => (
    <label className={fullWidth ? "min-w-0 basis-full" : "min-w-0 basis-full flex-1 sm:basis-auto"}>
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
      <PageTitle>Packing</PageTitle>

      {/* Above both lists because it governs one of them and explains the other
          (ticket 229): the tier is how much you like to take, and the button is
          the only thing that reads it. Side by side, that link is visible. */}
      <section className="mt-6 rounded-xl border border-rule bg-sheet px-4 py-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-4">
          <h2 className="typed !mb-0 w-full sm:w-auto">How you pack</h2>

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
          {packingPro ? (
            <form
              action={fillMyPackingList.bind(null, tripId)}
              className="ml-auto shrink-0"
            >
              <SubmitButton
                pendingLabel="Working it out…"
                className="!px-3 sm:!px-5"
              >
                Pack my bag
              </SubmitButton>
            </form>
          ) : (
            /* Present and inert, never hidden (ticket 248) — and whatever is
               already in the bag stays fully editable below. */
            <p className="ml-auto shrink-0 text-sm text-ink-soft">
              Packing your bag for you is{" "}
              <Link
                href="/settings?section=billing"
                className="text-pen underline underline-offset-2 hover:text-pen-deep"
              >
                a Floc Pro feature
              </Link>
              .
            </p>
          )}
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

      <section className="mt-9">
        <header className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl">Your bag</h2>
          <PackingCount total={mine.length} packed={bagPacked} />
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <PackingKitMenu kits={kits} apply={applyPackingKit.bind(null, tripId)} />
            {mine.length > 0 ? (
              <PackingBulkBar
                formId="bag-bulk"
                selecting={bagSelecting}
                selectHref={selectHref(true, true)}
                doneHref={selectHref(true, false)}
                removeSelected={removePackingLines.bind(null, tripId)}
                reset={resetPackingList.bind(null, tripId, true)}
                resetMessage="Clear your whole bag? The shared list stays."
              />
            ) : null}
          </div>
        </header>

        <form
          action={addPersonalPackingLine.bind(null, tripId)}
          className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-rule bg-sheet p-3"
        >
          {addBox("Add something to your bag")}
          <CategorySelect />
          <SubmitButton pendingLabel="Adding…" className="shrink-0">Add to my bag</SubmitButton>
        </form>

        {bagGroups.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            Start your bag above. Only you can see this list.
          </p>
        ) : (
          <div className="mt-4 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
            {bagGroups.map((group) => (
              <PackingCube
                key={group.key}
                heading={group.heading ?? "All items"}
                total={group.lines.length}
                packed={group.lines.filter((line) => line.packedAt !== null).length}
              >
                {group.lines.map((line) => (
                  <PersonalPackingRow
                    key={line.id}
                    tripId={tripId}
                    lineId={line.id}
                    label={line.label}
                    selectFormId={bagSelecting ? "bag-bulk" : null}
                    quantity={line.quantity}
                    packedAt={line.packedAt}
                    setPacked={setPersonalPackingPacked}
                    step={stepPersonalPackingQuantity}
                    remove={removePackingLine}
                    rename={renamePackingLine}
                    compact
                  />
                ))}
              </PackingCube>
            ))}
          </div>
        )}

      </section>

      <section className="mt-10">
        <header className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl">Who’s bringing what</h2>
          <PackingCount total={lines.length} packed={sharedPacked} />
          {lines.length > 0 ? (
            <div className="ml-auto">
              <PackingBulkBar
                formId="shared-bulk"
                selecting={sharedSelecting}
                selectHref={selectHref(false, true)}
                doneHref={selectHref(false, false)}
                removeSelected={removePackingLines.bind(null, tripId)}
                reset={resetPackingList.bind(null, tripId, false)}
                resetMessage="Clear the whole shared list for everyone?"
              />
            </div>
          ) : null}
        </header>

        <div className="mt-4 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          <PackingLane name="Up for grabs" count={lanes.open.length} open add={
            <form action={addPackingLine.bind(null, tripId)} className="flex flex-wrap items-center gap-2">
              {addBox("Add something for everyone", true)}
              <CategorySelect />
              <SubmitButton pendingLabel="Adding…" className="shrink-0 !px-3">Add to group</SubmitButton>
            </form>
          }>
            {lanes.open.map((line) => (
              <PackingClaimCard
                key={line.id}
                tripId={tripId}
                line={line}
                claimants={line.claims}
                personId={null}
                viewerId={access.viewer.id}
                selectFormId={sharedSelecting ? "shared-bulk" : null}
                actions={cardActions}
              />
            ))}
          </PackingLane>

          {lanes.people.map(({ member, lines: memberLines }) => (
            <PackingLane
              key={member.userId}
              name={member.userId === access.viewer.id ? "You" : member.name}
              count={memberLines.length}
              packed={memberLines.filter((line) =>
                Boolean(line.claims.find((claim) => claim.userId === member.userId)?.packedAt),
              ).length}
              avatar={<Avatar name={member.name} icon={member.avatarIcon} tone={member.tone} size={24} />}
            >
              {memberLines.map((line) => (
                <PackingClaimCard
                  key={line.id}
                  tripId={tripId}
                  line={line}
                  claimants={line.claims}
                  personId={member.userId}
                  viewerId={access.viewer.id}
                  selectFormId={sharedSelecting && line.claims[0]?.userId === member.userId ? "shared-bulk" : null}
                  actions={cardActions}
                />
              ))}
            </PackingLane>
          ))}

          {lanes.former.length > 0 ? (
            <PackingLane name="Past members" count={lanes.former.length}>
              {lanes.former.map((line) => (
                <PackingClaimCard
                  key={line.id}
                  tripId={tripId}
                  line={line}
                  claimants={line.claims}
                  personId={null}
                  viewerId={access.viewer.id}
                  selectFormId={sharedSelecting && !memberIds.has(line.claims[0]?.userId ?? "") ? "shared-bulk" : null}
                  actions={cardActions}
                />
              ))}
            </PackingLane>
          ) : null}
        </div>

      </section>
    </div>
  );
}
