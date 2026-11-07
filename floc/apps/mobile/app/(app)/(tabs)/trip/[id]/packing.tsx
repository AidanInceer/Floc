/**
 * Packing — your bag first, then the group's gear by person.
 *
 * TWO LISTS THAT NEVER MERGE (#220). A shared line is the group's and anyone
 * may claim or drop it; your bag is yours and nobody else can see or tick it.
 * The API keeps them apart, and so does this — there is no view that shows one
 * flat list, because there is no one flat list. Selecting is per list for the
 * same reason: a picked set spanning both would be one press over two rules.
 *
 * WHAT DRAWS A LINE IS NOT HERE. `packing-rows` owns a row, `packing-section`
 * owns a list's heading, count, toolbar and grouping, `packing-setup` owns the
 * once-a-trip controls. This owns the queries, the writes and what is picked.
 *
 * ADDING LEADS, SETUP SITS ABOVE IT. Setup is two lines, not four, because it
 * is furniture on every visit for a job done once (#126).
 */
import {
  type PackingLineGroup,
  type PackTier,
} from "@floc/core/packing/packing";
import { arrangePackingLanes } from "@floc/core/packing/packing-lanes";
import { ideasWhy } from "@floc/core/packing/packing-ideas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { PackingBulkBar } from "@/components/packing/packing-bulk-bar";
import { PackingKitSheet } from "@/components/packing/packing-kit-sheet";
import { MineRow, SharedRow, type SharedLine } from "@/components/packing/packing-rows";
import { ListsButton } from "@/components/packing/lists-button";
import { PackingSection } from "@/components/packing/packing-section";
import { IdeaRow } from "@/components/packing/packing-idea-row";
import { PackingSetup, PackingUpgrade } from "@/components/packing/packing-setup";
import { Sheet } from "@/components/system/sheet";
import { Failed, Loading } from "@/components/system/ui";
import { AddItem } from "@/components/packing/add-item";
import { needsRemoveConfirm } from "@/lib/packing/row-words";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";



/** The phone has no inline link here, so a gap's link reads as plain words. */
function whyLine(plan: Parameters<typeof ideasWhy>[0]): string {
  const why = ideasWhy(plan);
  return why.link ? `${why.text} ${why.link.label} ${why.link.after}` : why.text;
}

/** Which list is being picked in, or neither. One state, so a set cannot span both. */
type Picking = { list: "shared" | "mine"; ids: Set<number> } | null;

type LaneLine = SharedLine & { laneUserId?: string | null };

function lanePacked(line: LaneLine): boolean | null {
  if (!line.laneUserId) return null;
  return line.claims.find((claim) => claim.userId === line.laneUserId)?.packed ?? false;
}

function sharedClaimGroups(
  lines: SharedLine[],
  viewerId: string | undefined,
): PackingLineGroup<LaneLine>[] {
  const people = new Map<string, { userId: string; name: string }>();
  if (viewerId) people.set(viewerId, { userId: viewerId, name: "You" });
  for (const line of lines) {
    for (const person of line.claims) {
      if (!people.has(person.userId)) people.set(person.userId, person);
    }
  }
  const lanes = arrangePackingLanes(lines, [...people.values()]);
  return [
    { key: "open", heading: "Up for grabs", lines: lanes.open.map((line) => ({ ...line, laneUserId: null })) },
    ...lanes.people.map(({ member, lines: claimed }) => ({
      key: member.userId,
      heading: member.name,
      lines: claimed.map((line) => ({ ...line, laneUserId: member.userId })),
    })),
  ].filter((group) => group.lines.length > 0);
}

/**
 * The kit sheet's one busy flag and one message. Three mutations share a sheet,
 * and folding them here keeps the screen's own branching inside its ceiling.
 */
function sheetState(
  apply: { isPending: boolean },
  save: { isPending: boolean; isError: boolean; error: { message: string } | null },
  drop: { isPending: boolean },
): { busy: boolean; error: string | null } {
  return {
    busy: apply.isPending || save.isPending || drop.isPending,
    // Only saving can be rejected for something the user typed; the other two
    // take an id the sheet drew, so their failures are not this sheet's news.
    error: save.isError && save.error ? save.error.message : null,
  };
}

export default function Packing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const queryClient = useQueryClient();

  const board = useQuery(trpc.packing.list.queryOptions({ tripId }, { enabled: ready }));
  const me = useQuery(trpc.me.get.queryOptions());

  const [picking, setPicking] = useState<Picking>(null);
  const [kitsOpen, setKitsOpen] = useState(false);
  const [ideasHidden, setIdeasHidden] = useState(false);

  const again = () =>
    queryClient.invalidateQueries({ queryKey: trpc.packing.list.queryKey({ tripId }) });

  const add = useMutation({
    ...trpc.packing.add.mutationOptions(),
    onSuccess: () => {
      again();
    },
  });
  const claim = useMutation({ ...trpc.packing.claim.mutationOptions(), onSuccess: again });
  const tick = useMutation({ ...trpc.packing.setPacked.mutationOptions(), onSuccess: again });
  const step = useMutation({ ...trpc.packing.stepQuantity.mutationOptions(), onSuccess: again });
  const drop = useMutation({ ...trpc.packing.remove.mutationOptions(), onSuccess: again });
  const rename = useMutation({ ...trpc.packing.rename.mutationOptions(), onSuccess: again });
  const setTier = useMutation({ ...trpc.packing.setTier.mutationOptions(), onSuccess: again });
  const fill = useMutation({ ...trpc.packing.fillMyBag.mutationOptions(), onSuccess: again });
  const takeIdea = useMutation({ ...trpc.packing.takeIdea.mutationOptions(), onSuccess: again });
  const removeSuggested = useMutation({ ...trpc.packing.removeSuggested.mutationOptions(), onSuccess: again });
  const applyKit = useMutation({
    ...trpc.packing.applyKit.mutationOptions(),
    onSuccess: () => {
      setKitsOpen(false);
      again();
    },
  });
  // Saving leaves the sheet open: you have just made a kit and the list it
  // joined is the thing worth seeing.
  const saveKit = useMutation({ ...trpc.packing.saveKit.mutationOptions(), onSuccess: again });
  const dropKit = useMutation({ ...trpc.packing.deleteKit.mutationOptions(), onSuccess: again });
  const kitState = sheetState(applyKit, saveKit, dropKit);
  // Picking closes on success: the rows it referred to are gone, so a bar still
  // counting them would be counting nothing.
  const closePicking = () => {
    setPicking(null);
    again();
  };
  const dropMany = useMutation({
    ...trpc.packing.removeMany.mutationOptions(),
    onSuccess: closePicking,
  });
  const empty = useMutation({
    ...trpc.packing.reset.mutationOptions(),
    onSuccess: closePicking,
  });

  if (board.isPending) return <Loading />;
  if (board.isError) return <Failed onRetry={() => board.refetch()} />;

  const viewerId = me.data?.id;
  const sharedPacked = board.data.shared.filter((line) =>
    line.claims.some((c) => c.packed),
  ).length;
  const minePacked = board.data.mine.filter((line) => line.packed).length;
  const sharedGroups = sharedClaimGroups(board.data.shared, viewerId);
  const unsuggest = {
    count: board.data.mine.filter((line) => line.suggested && !line.packed).length,
    onPress: () => removeSuggested.mutate({ tripId }),
  };

  /** Toggling one row inside whichever list is being picked in. */
  const toggle = (list: "shared" | "mine", lineId: number) =>
    setPicking((current) => {
      const ids = new Set(current?.list === list ? current.ids : []);
      if (ids.has(lineId)) ids.delete(lineId);
      else ids.add(lineId);
      return { list, ids };
    });

  const startPicking = (list: "shared" | "mine", on: boolean) =>
    setPicking(on ? { list, ids: new Set() } : null);

  const busyBulk = dropMany.isPending || empty.isPending;
  const confirmClear = (mine: boolean) =>
    Alert.alert(
      mine ? "Clear your whole bag?" : "Clear the shared list for everyone?",
      mine ? "The shared list stays." : "Everyone's shared items will be removed.",
      [
        { text: "Keep it", style: "cancel" },
        { text: "Clear list", style: "destructive", onPress: () => empty.mutate({ tripId, mine }) },
      ],
    );

  const confirmRemoveShared = (line: SharedLine) => {
    const remove = () => drop.mutate({ tripId, lineId: line.id });
    if (!needsRemoveConfirm(line.claims, viewerId)) return remove();
    Alert.alert(`Remove ${line.label} for everyone?`, "Other people are bringing it.", [
      { text: "Keep it", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: remove },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        {board.data.canAutoFill ? (
          <PackingSetup
            why={whyLine(board.data.plan)}
            tier={board.data.tier}
            onTier={(tier: PackTier) => setTier.mutate({ tripId, tier })}
            ideas={{ count: board.data.ideas.length, hidden: ideasHidden, onToggle: () => setIdeasHidden((h) => !h) }}
            fill={{ busy: fill.isPending, onPress: () => fill.mutate({ tripId }) }}
            removeSuggested={unsuggest}
            error={fill.isError ? fill.error.message : takeIdea.isError ? takeIdea.error.message : null}
          />
        ) : (
          <PackingUpgrade
            onUpgrade={() => router.push("/settings")}
            removeSuggested={unsuggest}
          />
        )}

        <AddItem
          busy={add.isPending}
          error={add.isError ? add.error.message : null}
          onAdd={(item, done) => add.mutate({ tripId, ...item }, { onSuccess: done })}
        />

        <PackingSection
          heading="Your bag"
          headerAction={
            <ListsButton count={board.data.kits.length} onPress={() => setKitsOpen(true)} />
          }
          isPacked={(line) => line.packed}
          aside="Only you can see this list."
          lines={board.data.mine}
          packed={minePacked}
          selecting={picking?.list === "mine"}
          onSelecting={(on) => startPicking("mine", on)}
          onClear={() => confirmClear(true)}
          emptyWord="Your bag is empty."
          ideas={{
            list: ideasHidden ? [] : board.data.ideas,
            render: (idea) => (
              <IdeaRow
                key={idea.label}
                idea={idea}
                busy={takeIdea.isPending}
                onTake={() => takeIdea.mutate({ tripId, label: idea.label })}
              />
            ),
          }}
          renderLine={(line) => (
            <MineRow
              key={line.id}
              line={line}
              selecting={picking?.list === "mine"}
              selected={picking?.ids.has(line.id) ?? false}
              onToggleSelected={() => toggle("mine", line.id)}
              onStep={(delta) => step.mutate({ tripId, lineId: line.id, delta })}
              onPacked={(packed) => tick.mutate({ tripId, lineId: line.id, packed })}
              onRemove={() => drop.mutate({ tripId, lineId: line.id })}
              onRename={(label) => rename.mutateAsync({ tripId, lineId: line.id, label })}
            />
          )}
        />

        <PackingSection<LaneLine>
          heading="Who’s bringing what"
          isPacked={lanePacked}
          lines={board.data.shared}
          packed={sharedPacked}
          selecting={picking?.list === "shared"}
          onSelecting={(on) => startPicking("shared", on)}
          onClear={() => confirmClear(false)}
          emptyWord="Nothing on the group’s list yet."
          groupsOverride={sharedGroups}
          renderLine={(line) => (
            <SharedRow
              key={line.id}
              line={line}
              viewerId={viewerId}
              laneUserId={line.laneUserId}
              selecting={picking?.list === "shared"}
              selected={picking?.ids.has(line.id) ?? false}
              onToggleSelected={() => toggle("shared", line.id)}
              onClaim={(claimed) => claim.mutate({ tripId, lineId: line.id, claimed })}
              onPacked={(packed) => tick.mutate({ tripId, lineId: line.id, packed })}
              onRemove={() => confirmRemoveShared(line)}
              onRename={(label) => rename.mutateAsync({ tripId, lineId: line.id, label })}
            />
          )}
        />

        {/* Room for the pinned bar, so the last row is never under it. */}
        {picking ? <View style={{ height: 150 }} /> : null}
      </ScrollView>

      {picking ? (
        <PackingBulkBar
          listName={picking.list === "mine" ? "My bag" : "The group's list"}
          picked={picking.ids.size}
          busy={busyBulk}
          onRemove={() =>
            dropMany.mutate({ tripId, lineIds: [...picking.ids] })
          }
          onDone={() => setPicking(null)}
        />
      ) : null}

      <Sheet open={kitsOpen} onClose={() => setKitsOpen(false)}>
        <PackingKitSheet
          kits={board.data.kits}
          bagSize={board.data.mine.length}
          busy={kitState.busy}
          error={kitState.error}
          onApply={(kitId) => applyKit.mutate({ tripId, kitId })}
          onSave={(name) => saveKit.mutate({ tripId, name })}
          onDelete={(kitId) => dropKit.mutate({ tripId, kitId })}
        />
      </Sheet>
    </View>
  );
}
