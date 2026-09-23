/**
 * Packing — the group's list on top, your own bag underneath.
 *
 * LAYOUT B, AS ON THE WEB (#219). Both lists full-width, group first, so the
 * screen reads the same top-to-bottom on a phone as the page does on a desk.
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
 * THE FILTER IS A VIEW, NOT A GATE (rule 4). "All" is always there and no line
 * is ever unreachable. The same is true of the tier, the kits and auto-fill —
 * a trip packs perfectly well with none of them touched.
 *
 * ADDING LEADS, SETUP SITS ABOVE IT. Setup is two lines, not four, because it
 * is furniture on every visit for a job done once (#126).
 */
import {
  PACK_CATEGORIES,
  PACK_CATEGORY_LABELS,
  type PackCategory,
  type PackSort,
  type PackTier,
} from "@floc/core/packing/packing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { CategoryChips, type CategoryFilter } from "@/components/days/category-chips";
import { PackingBulkBar } from "@/components/packing/packing-bulk-bar";
import { PackingKitSheet } from "@/components/packing/packing-kit-sheet";
import { MineRow, SharedRow } from "@/components/packing/packing-rows";
import { PackingSection } from "@/components/packing/packing-section";
import { PackingSetup } from "@/components/packing/packing-setup";
import { Sheet } from "@/components/system/sheet";
import {
  Body,
  Button,
  Card,
  Dropdown,
  Failed,
  Field,
  Label,
  Loading,
  Segmented,
} from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

const CATEGORIES = PACK_CATEGORIES.map((value) => ({
  value,
  label: PACK_CATEGORY_LABELS[value],
}));

const LISTS = [
  { value: "shared" as const, label: "The group's" },
  { value: "mine" as const, label: "My bag" },
];

/** The group's list shows no count, so ordering by one would sort by something invisible. */
const SHARED_SORTS: readonly PackSort[] = ["category", "name"];
const MINE_SORTS: readonly PackSort[] = ["category", "name", "quantity"];

/** Which list is being picked in, or neither. One state, so a set cannot span both. */
type Picking = { list: "shared" | "mine"; ids: Set<number> } | null;

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

  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [addingTo, setAddingTo] = useState<"shared" | "mine">("shared");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<PackCategory>("essentials");
  const [sharedSort, setSharedSort] = useState<PackSort>("category");
  const [mineSort, setMineSort] = useState<PackSort>("category");
  const [picking, setPicking] = useState<Picking>(null);
  const [kitsOpen, setKitsOpen] = useState(false);

  const again = () =>
    queryClient.invalidateQueries({ queryKey: trpc.packing.list.queryKey({ tripId }) });

  const add = useMutation({
    ...trpc.packing.add.mutationOptions(),
    onSuccess: () => {
      setLabel("");
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
  const filtered = filter !== "all";
  const sharedPacked = board.data.shared.filter((line) =>
    line.claims.some((c) => c.packed),
  ).length;
  const minePacked = board.data.mine.filter((line) => line.packed).length;

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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        <PackingSetup
          tier={board.data.tier}
          onTier={(tier: PackTier) => setTier.mutate({ tripId, tier })}
          kits={board.data.kits}
          canAutoFill={board.data.canAutoFill}
          filling={fill.isPending}
          onFill={() => fill.mutate({ tripId })}
          onPickKit={() => setKitsOpen(true)}
          error={fill.isError ? fill.error.message : null}
        />

        <Card>
          <View style={{ gap: space.md }}>
            <Label>Add something</Label>
            <Segmented options={LISTS} value={addingTo} onChange={setAddingTo} />
            <Field label="What is it" value={label} onChangeText={setLabel} />
            {/* A dropdown, not a strip: a second scrolling row of the same eight words
                sitting above the filter read as one control asking one question. */}
            <Dropdown label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
            <Button
              label="Add it"
              busy={add.isPending}
              disabled={label.trim() === ""}
              onPress={() =>
                add.mutate({ tripId, label: label.trim(), category, mine: addingTo === "mine" })
              }
            />
            {add.isError ? <Body tone="red">{add.error.message}</Body> : null}
          </View>
        </Card>

        <CategoryChips value={filter} onChange={setFilter} />

        <PackingSection
          heading="What the group brings"
          lines={board.data.shared}
          packed={sharedPacked}
          filter={filter}
          sort={sharedSort}
          sorts={SHARED_SORTS}
          onSort={setSharedSort}
          selecting={picking?.list === "shared"}
          onSelecting={(on) => startPicking("shared", on)}
          emptyWord={
            filtered
              ? "Nothing on the group's list in this one."
              : "Nothing on the group's list yet."
          }
          renderLine={(line) => (
            <SharedRow
              key={line.id}
              line={line}
              viewerId={viewerId}
              selecting={picking?.list === "shared"}
              selected={picking?.ids.has(line.id) ?? false}
              onToggleSelected={() => toggle("shared", line.id)}
              onClaim={(claimed) => claim.mutate({ tripId, lineId: line.id, claimed })}
              onPacked={(packed) => tick.mutate({ tripId, lineId: line.id, packed })}
              onRemove={() => drop.mutate({ tripId, lineId: line.id })}
              onRename={(label) => rename.mutateAsync({ tripId, lineId: line.id, label })}
            />
          )}
        />

        <PackingSection
          heading="My bag"
          aside="Only you can see this list."
          lines={board.data.mine}
          packed={minePacked}
          filter={filter}
          sort={mineSort}
          sorts={MINE_SORTS}
          onSort={setMineSort}
          selecting={picking?.list === "mine"}
          onSelecting={(on) => startPicking("mine", on)}
          emptyWord={filtered ? "Nothing in your bag in this one." : "Start your bag — add the first thing above."}
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

        {/* Room for the pinned bar, so the last row is never under it. */}
        {picking ? <View style={{ height: 150 }} /> : null}
      </ScrollView>

      {picking ? (
        <PackingBulkBar
          listName={picking.list === "mine" ? "My bag" : "The group's list"}
          picked={picking.ids.size}
          total={picking.list === "mine" ? board.data.mine.length : board.data.shared.length}
          busy={busyBulk}
          onRemove={() =>
            dropMany.mutate({ tripId, lineIds: [...picking.ids] })
          }
          onEmpty={() => empty.mutate({ tripId, mine: picking.list === "mine" })}
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
