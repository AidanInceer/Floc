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
import { packingStatus, resolvePackTier } from "@floc/core/packing/packing";
import { packingCubes, packingIdeas } from "@floc/core/packing/packing-ideas";
import { arrangePackingLanes } from "@floc/core/packing/packing-lanes";
import {
  CategorySelect,
  PackingBulkBar,
  PackingKitMenu,
} from "@/components/packing/packing-controls";
import { PackingCount } from "@/components/packing/packing-card";
import { PackingCube } from "@/components/packing/packing-cube";
import { PackingLane } from "@/components/packing/packing-lane";
import { PackingClaimCard } from "@/components/packing/packing-claim-card";
import { Avatar, PageTitle } from "@/components/system/ui";
import { PackingAutoLine, PackingUpgradeLine, RemoveSuggested } from "@/components/packing/packing-auto-line";
import { PackingIdeaRow } from "@/components/packing/packing-idea-row";
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

  const ideasHidden = query.ideas === "off";
  const ideas = packingPro
    ? packingIdeas({ nights: plan.nights, climate: plan.climate, tier }, mine.map((l) => l.label))
    : [];
  const bagCubes = packingCubes(mine, ideasHidden ? [] : ideas);
  const suggestedCount = mine.filter((l) => l.origin === "suggested" && l.packedAt === null).length;
  const takeIdea = takePackingIdea.bind(null, tripId);
  const removeSuggested = (
    <RemoveSuggested count={suggestedCount} action={removeSuggestedPackingLines.bind(null, tripId)} />
  );

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
        className="w-full rounded-sm border border-rule bg-sheet px-4 py-2.5 text-sm placeholder:text-ink-faint focus-visible:border-pen"
      />
    </label>
  );

  return (
    <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 pt-6 sm:px-6">
      <PageTitle>Packing</PageTitle>

      <section className="mt-6 grid gap-4">
        <header className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl">Your bag</h2>
          <PackingCount total={mine.length} packed={bagPacked} />
          <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
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

        {packingPro ? (
          <PackingAutoLine
            tripId={tripId}
            plan={plan}
            tier={tier}
            ideaCount={ideas.length}
            hidden={ideasHidden}
            toggleHref={ideasHidden ? path : `${path}?ideas=off`}
            actions={{ setTier: setTripPackTier.bind(null, tripId), addAll: fillMyPackingList.bind(null, tripId) }}
            removeSuggested={removeSuggested}
          />
        ) : (
          <PackingUpgradeLine removeSuggested={removeSuggested} />
        )}

        <form action={addPersonalPackingLine.bind(null, tripId)} className="flex flex-wrap items-center gap-2">
          {addBox("Add something to your bag")}
          <CategorySelect />
          <SubmitButton variant="secondary" pendingLabel="Adding…" className="shrink-0">Add</SubmitButton>
        </form>

        {bagCubes.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Start your bag above. Only you can see this list.
          </p>
        ) : (
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
                    selectFormId={bagSelecting ? "bag-bulk" : null}
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
