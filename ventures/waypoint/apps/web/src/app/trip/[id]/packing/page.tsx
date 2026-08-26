/**
 * Packing tab (ticket 219, parent 154). Layout B — stacked full-width cards;
 * the shared list is the only one until the personal list lands next slice.
 */
import { requireTripAccess } from "@/server/access";
import { listPackingClaims, listPackingLines } from "@/server/packing";
import { EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { PackingLineRow } from "@/components/packing-line-row";
import type { PackingClaimant } from "@/components/packing-line-row";
import {
  addPackingLine,
  removePackingLine,
  setPackingClaim,
  setPackingPacked,
} from "./actions";

export default async function PackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireTripAccess(id, `/trip/${id}/packing`);
  const tripId = access.trip.id;

  const [lines, claims] = await Promise.all([
    listPackingLines(tripId),
    listPackingClaims(tripId),
  ]);

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
    </div>
  );
}
