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
import { PACK_TIERS, PACK_TIER_LABELS, resolvePackTier } from "@/lib/packing";
import Link from "next/link";
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
} from "./actions";

export default async function PackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
          <SubmitButton pendingLabel="Adding…">Add to the list</SubmitButton>
        </form>

        <div className="mt-4">
          {lines.length === 0 ? (
            <EmptyState title="No shared packing yet.">
              The gear one of you brings for everyone — a speaker, a kettle, the
              first-aid kit.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-sheet">
              {lines.map((line) => (
                <PackingLineRow
                  key={line.id}
                  tripId={tripId}
                  lineId={line.id}
                  label={line.label}
                  claimants={claimsByLine.get(line.id) ?? []}
                  viewerId={access.viewer.id}
                  setClaim={setPackingClaim}
                  setPacked={setPackingPacked}
                  remove={removePackingLine}
                />
              ))}
            </ul>
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
          <SubmitButton pendingLabel="Adding…">Add to my bag</SubmitButton>
        </form>

        <div className="mt-4">
          {mine.length === 0 ? (
            <EmptyState title="Your bag’s empty.">
              Only you can see this list.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-sheet">
              {mine.map((line) => (
                <PersonalPackingRow
                  key={line.id}
                  tripId={tripId}
                  lineId={line.id}
                  label={line.label}
                  quantity={line.quantity}
                  packedAt={line.packedAt}
                  setPacked={setPersonalPackingPacked}
                  step={stepPersonalPackingQuantity}
                  remove={removePackingLine}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
