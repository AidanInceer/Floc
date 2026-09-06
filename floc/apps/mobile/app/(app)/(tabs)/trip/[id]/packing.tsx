/**
 * Packing — the group's list on top, your own bag underneath.
 *
 * LAYOUT B, AS ON THE WEB (#219). Both lists full-width, group first, so the
 * screen reads the same top-to-bottom on a phone as the page does on a desk.
 *
 * TWO LISTS THAT NEVER MERGE (#220). A shared line is the group's and anyone
 * may claim or drop it; your bag is yours and nobody else can see or tick it.
 * The API keeps them apart, and so does this — there is no view that shows one
 * flat list, because there is no one flat list.
 *
 * WHAT DRAWS A LINE IS NOT HERE. `packing-rows` owns the markup; this owns the
 * queries, the grouping and the form. The screen was one file doing both and
 * it read like it (#302).
 *
 * GROUPED BY CATEGORY, LIKE THE PAGE. Headings come from `PACK_CATEGORIES` in
 * its own order and empty ones are dropped, so eight always-present headings
 * do not push the list off the bottom.
 *
 * THE FILTER IS A VIEW, NOT A GATE (rule 4). "All" is always there and no line
 * is ever unreachable.
 *
 * ADDING LEADS. The form sat at the foot under both lists, so on a full trip
 * the one thing you came to do was a scroll away. Nothing is said about tiers,
 * saved kits or the auto-filler any more — a footnote naming absent features
 * is furniture on every visit for a thing wanted once (#126).
 */
import {
  PACK_CATEGORIES,
  PACK_CATEGORY_LABELS,
  type PackCategory,
} from "@floc/core/packing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { CategoryChips, type CategoryFilter } from "@/components/category-chips";
import { MineRow, SharedRow } from "@/components/packing-rows";
import {
  Body,
  Button,
  Card,
  Dropdown,
  Empty,
  Failed,
  Field,
  Heading,
  Label,
  Loading,
  Segmented,
} from "@/components/ui";
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

type Section<T> = { heading: string; lines: T[] };

/** Category order, empty groups dropped. `PACK_CATEGORIES` is the order; nothing re-sorts it. */
function group<T extends { category: PackCategory }>(
  lines: T[],
  filter: CategoryFilter,
): Section<T>[] {
  const kept = filter === "all" ? lines : lines.filter((line) => line.category === filter);
  return PACK_CATEGORIES.map((category) => ({
    heading: PACK_CATEGORY_LABELS[category],
    lines: kept.filter((line) => line.category === category),
  })).filter((section) => section.lines.length > 0);
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

  if (board.isPending) return <Loading />;
  if (board.isError) return <Failed onRetry={() => board.refetch()} />;

  const viewerId = me.data?.id;
  const sharedSections = group(board.data.shared, filter);
  const mineSections = group(board.data.mine, filter);
  const filtered = filter !== "all";

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
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

      <View style={{ gap: space.sm }}>
        <Heading>What the group brings</Heading>
        {sharedSections.length === 0 ? (
          <Empty>
            {filtered
              ? "Nothing on the group's list in this one."
              : "Nothing on the group's list yet."}
          </Empty>
        ) : null}
        {sharedSections.map((section) => (
          <View key={section.heading} style={{ gap: space.sm, paddingTop: space.sm }}>
            <Label>{section.heading}</Label>
            {section.lines.map((line) => (
              <SharedRow
                key={line.id}
                line={line}
                viewerId={viewerId}
                onClaim={(claimed) => claim.mutate({ tripId, lineId: line.id, claimed })}
                onPacked={(packed) => tick.mutate({ tripId, lineId: line.id, packed })}
                onRemove={() => drop.mutate({ tripId, lineId: line.id })}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={{ gap: space.sm }}>
        <Heading>My bag</Heading>
        <Body tone="ink-3">Only you can see this list.</Body>
        {mineSections.length === 0 ? (
          <Empty>{filtered ? "Nothing in your bag in this one." : "Your bag is empty."}</Empty>
        ) : null}
        {mineSections.map((section) => (
          <View key={section.heading} style={{ gap: space.sm, paddingTop: space.sm }}>
            <Label>{section.heading}</Label>
            {section.lines.map((line) => (
              <MineRow
                key={line.id}
                line={line}
                onStep={(delta) => step.mutate({ tripId, lineId: line.id, delta })}
                onPacked={(packed) => tick.mutate({ tripId, lineId: line.id, packed })}
                onRemove={() => drop.mutate({ tripId, lineId: line.id })}
              />
            ))}
          </View>
        ))}
      </View>

    </ScrollView>
  );
}
