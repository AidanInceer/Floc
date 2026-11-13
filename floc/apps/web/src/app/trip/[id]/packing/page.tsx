import { requireTripAccess } from "@/server/access";
import { readPackingBoard } from "@/server/packing/packing-board";
import { packedLineCount, packingCubes } from "@floc/core/packing/packing";
import { arrangePackingLanes } from "@floc/core/packing/packing-lanes";
import {
  PackingBulkBar,
  PackingBagMore,
} from "@/components/packing/packing-controls";
import { PackingAddField } from "@/components/packing/packing-add-field";
import { PackingFillMenu } from "@/components/packing/packing-fill-menu";
import { PackingCount } from "@/components/packing/packing-card";
import { PackingCube } from "@/components/packing/packing-cube";
import { PackingLane } from "@/components/packing/packing-lane";
import { PackingClaimCard } from "@/components/packing/packing-claim-card";
import { Avatar, PageTitle } from "@/components/system/ui";
import { LockIcon } from "@/components/system/icons/packing";
import { PackingIdeaRow } from "@/components/packing/packing-idea-row";
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
  takePackingIdea,
  removeSuggestedPackingLines,
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

  const { lines, claims, mine, kits, tier, packingPro, ideas } =
    await readPackingBoard(access.trip, access.viewer.id);

  const path = `/trip/${tripId}/packing`;
  const sharedSelecting = query.sharedPick === "1";
  const selectHref = (select: boolean) => (select ? `${path}?sharedPick=1` : path);

  // A prefetch can't trigger the first-open fill: the tab renders behind
  // `loading.tsx`, which is as far as Next prefetches a dynamic segment.
  const bagCubes = packingCubes(mine, ideas);
  const suggestedCount = mine.filter((l) => l.origin === "suggested" && l.packedAt === null).length;
  const takeIdea = takePackingIdea.bind(null, tripId);

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

  const bagPacked = mine.filter((l) => l.packedAt !== null).length;
  const sharedItems = lines.map((line) => ({
    ...line,
    claims: claimsByLine.get(line.id) ?? [],
  }));
  const sharedPacked = packedLineCount(sharedItems);
  const lanes = arrangePackingLanes(sharedItems, access.members);
  const memberIds = new Set(access.members.map((member) => member.userId));
  const cardActions = {
    claim: setPackingClaim,
    pack: setPackingPacked,
    remove: removePackingLine,
    rename: renamePackingLine,
  };

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <PageTitle className="sr-only">Packing</PageTitle>

      <section className="grid gap-4">
        <header className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xl">Your bag</h2>
          <PackingCount total={mine.length} packed={bagPacked} />
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-faint max-sm:self-center">
            <LockIcon />
            Only you
          </span>
          <div className="ml-auto flex self-center flex-wrap items-center justify-end gap-x-2 gap-y-2">
            <PackingFillMenu
              kits={kits}
              apply={applyPackingKit.bind(null, tripId)}
              auto={packingPro ? {
                tier,
                ideaCount: ideas.length,
                setTier: setTripPackTier.bind(null, tripId),
                addAll: fillMyPackingList.bind(null, tripId),
              } : null}
            />
            <PackingBagMore
              reset={mine.length > 0 ? resetPackingList.bind(null, tripId, true) : null}
              suggested={{ count: suggestedCount, remove: removeSuggestedPackingLines.bind(null, tripId) }}
            />
          </div>
        </header>

        <PackingAddField add={addPersonalPackingLine.bind(null, tripId)} />

        {bagCubes.length === 0 ? null : (
          <div className="gap-3 md:columns-2 xl:columns-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
            {bagCubes.map((group) => (
              <PackingCube
                key={group.key}
                heading={group.heading}
                total={group.lines.length}
                packed={group.lines.filter((line) => line.packedAt !== null).length}
                ideaCount={group.ideas.length}
              >
                {group.lines.map((line) => (
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
                    rename={renamePackingLine}
                    compact
                    suggested={line.origin === "suggested"}
                  />
                ))}
                {group.ideas.map((idea) => (
                  <PackingIdeaRow key={idea.label} label={idea.label} quantity={idea.quantity} take={takeIdea} />
                ))}
              </PackingCube>
            ))}
          </div>
        )}

      </section>

      <section className="mt-10">
        <header className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xl">Shared packing</h2>
          <PackingCount total={lines.length} packed={sharedPacked} />
          {lines.length > 0 ? (
            <div className="ml-auto self-center">
              <PackingBulkBar
                formId="shared-bulk"
                selecting={sharedSelecting}
                selectHref={selectHref(true)}
                doneHref={selectHref(false)}
                removeSelected={removePackingLines.bind(null, tripId)}
                reset={resetPackingList.bind(null, tripId, false)}
                resetMessage="Clear the whole shared list for everyone?"
              />
            </div>
          ) : null}
        </header>

        <div className="mt-4 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          <PackingLane name="Up for grabs" count={lanes.open.length} open add={
            <PackingAddField add={addPackingLine.bind(null, tripId)} label="Add something for everyone" />
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
              avatar={<Avatar name={member.name} tone={member.tone} size={24} />}
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
