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
 * THE STATUS IS A WORD (#204). "Unclaimed", "Claimed", "2 of 3 packed" — from
 * `packingStatusLabel`, the same function the web badge uses, so the two can
 * never disagree about when a line counts as packed.
 *
 * NOT HERE: tiers, saved kits, the auto-filler, filters, sorts and the bulk
 * bar. Those are a deskful of controls; the screen says where they live.
 */
import {
  PACK_CATEGORIES,
  PACK_CATEGORY_LABELS,
  packingStatusLabel,
  type PackCategory,
} from "@floc/core/packing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { Body, Button, Card, Empty, Failed, Field, Heading, Label, Loading, Pill, Segmented } from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

/** Only nullness is read by `packingStatusLabel`; the wire carries a boolean, not a time (rule 10). */
const SOME_TIME = new Date(0);

const CATEGORIES = PACK_CATEGORIES.map((value) => ({
  value,
  label: PACK_CATEGORY_LABELS[value],
}));

const LISTS = [
  { value: "shared" as const, label: "The group's" },
  { value: "mine" as const, label: "My bag" },
];

export default function Packing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const queryClient = useQueryClient();

  const board = useQuery(trpc.packing.list.queryOptions({ tripId }, { enabled: ready }));
  const me = useQuery(trpc.me.get.queryOptions());

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
  const drop = useMutation({ ...trpc.packing.remove.mutationOptions(), onSuccess: again });

  if (board.isPending) return <Loading />;
  if (board.isError) return <Failed onRetry={() => board.refetch()} />;

  const viewerId = me.data?.id;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View style={{ gap: space.md }}>
        <Heading>What the group brings</Heading>
        {board.data.shared.length === 0 ? (
          <Empty>Nothing on the group&apos;s list yet.</Empty>
        ) : null}
        {board.data.shared.map((line) => {
          const mine = line.claims.find((c) => c.userId === viewerId);
          return (
            <Card key={line.id}>
              <View style={{ gap: space.sm }}>
                <Body bold>{line.label}</Body>
                <Pill
                  word={packingStatusLabel(
                    line.claims.map((c) => ({ packedAt: c.packed ? SOME_TIME : null })),
                  )}
                  tone={line.claims.length === 0 ? "butter" : "mint"}
                />
                {/* Who, by name — a colour would say the same thing to fewer people (#204). */}
                {line.claims.length > 0 ? (
                  <Body tone="ink-2">
                    {line.claims.map((c) => `${c.name}${c.packed ? " (packed)" : ""}`).join(", ")}
                  </Body>
                ) : null}
                <Button
                  label={mine ? "Not me after all" : "I'll bring it"}
                  variant={mine ? "quiet" : "primary"}
                  onPress={() => claim.mutate({ tripId, lineId: line.id, claimed: !mine })}
                />
                {mine ? (
                  <Button
                    label={mine.packed ? "Packed — undo" : "I've packed it"}
                    variant="quiet"
                    onPress={() => tick.mutate({ tripId, lineId: line.id, packed: !mine.packed })}
                  />
                ) : null}
                {/* The list is the group's, so a line nobody wants is anyone's to drop. */}
                <Button
                  label="Remove"
                  variant="danger"
                  onPress={() => drop.mutate({ tripId, lineId: line.id })}
                />
              </View>
            </Card>
          );
        })}
      </View>

      <View style={{ gap: space.md }}>
        <Heading>My bag</Heading>
        <Body tone="ink-3">Only you can see this list.</Body>
        {board.data.mine.length === 0 ? <Empty>Your bag is empty.</Empty> : null}
        {board.data.mine.map((line) => (
          <Card key={line.id}>
            <View style={{ gap: space.sm }}>
              <Body bold>
                {line.label}
                {line.quantity > 1 ? ` ×${line.quantity}` : ""}
              </Body>
              <Pill word={line.packed ? "Packed" : "Not packed"} tone={line.packed ? "mint" : "butter"} />
              <Button
                label={line.packed ? "Packed — undo" : "I've packed it"}
                variant="quiet"
                onPress={() => tick.mutate({ tripId, lineId: line.id, packed: !line.packed })}
              />
              <Button
                label="Remove"
                variant="danger"
                onPress={() => drop.mutate({ tripId, lineId: line.id })}
              />
            </View>
          </Card>
        ))}
      </View>

      <Card>
        <View style={{ gap: space.md }}>
          <Label>Add something</Label>
          <Segmented options={LISTS} value={addingTo} onChange={setAddingTo} />
          <Field label="What is it" value={label} onChangeText={setLabel} />
          <Segmented options={CATEGORIES} value={category} onChange={setCategory} />
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

      <Body tone="ink-3">
        Packing tiers, saved kits and the auto-filler are on the website.
      </Body>
    </ScrollView>
  );
}
