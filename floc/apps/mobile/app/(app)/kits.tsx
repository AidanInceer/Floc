/**
 * Saved packing lists (ticket 230) — yours, not a trip's.
 *
 * ONE LEVEL UNDER YOU, NOT A TAB. A kit belongs to a person, so it hangs off
 * the profile; the bottom bar is still the three places that are not a trip.
 *
 * THE SAME OBJECT AS A BAG, DRAWN THE SAME WAY. A photography kit and the bag
 * on a trip are one idea at two moments — so the rows here are the packing
 * rows, not a settings form.
 *
 * MAKING ONE FROM A TRIP STILL LIVES ON THE TRIP. `packing.saveKit` names the
 * bag in front of you, which is the faster way in and the reason this screen
 * does not need a list builder to be useful. This is where you edit one after.
 */
import { PACK_CATEGORIES, PACK_CATEGORY_LABELS, type PackCategory } from "@floc/core/packing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { KitCard } from "@/components/kit-card";
import { Sheet } from "@/components/sheet";
import {
  Body,
  Button,
  Dropdown,
  Empty,
  Failed,
  Field,
  Label,
  Loading,
} from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

const CATEGORY_OPTIONS = PACK_CATEGORIES.map((category) => ({
  value: category,
  label: PACK_CATEGORY_LABELS[category],
}));

/** The thing being added, and which list it is going into. Null when the sheet is shut. */
type NewItem = { kitId: number; label: string; category: PackCategory };

export default function Kits() {
  const queryClient = useQueryClient();
  const kits = useQuery(trpc.kits.list.queryOptions());

  const [name, setName] = useState("");
  const [item, setItem] = useState<NewItem | null>(null);
  const [capped, setCapped] = useState(false);

  const reload = () => queryClient.invalidateQueries({ queryKey: trpc.kits.list.queryKey() });

  const create = useMutation({
    ...trpc.kits.create.mutationOptions(),
    onSuccess: (made) => {
      // Null is the ceiling, not a failure — say so rather than doing nothing.
      setCapped(made === null);
      if (made !== null) setName("");
      reload();
    },
  });
  const rename = useMutation({ ...trpc.kits.rename.mutationOptions(), onSuccess: reload });
  const remove = useMutation({ ...trpc.kits.remove.mutationOptions(), onSuccess: reload });
  const addItem = useMutation({
    ...trpc.kits.addItem.mutationOptions(),
    onSuccess: () => {
      setItem(null);
      reload();
    },
  });
  const removeItem = useMutation({ ...trpc.kits.removeItem.mutationOptions(), onSuccess: reload });
  const stepItem = useMutation({ ...trpc.kits.stepItem.mutationOptions(), onSuccess: reload });

  const busy =
    rename.isPending || remove.isPending || removeItem.isPending || stepItem.isPending;

  if (kits.isPending) return <Loading />;
  if (kits.isError) return <Failed onRetry={() => kits.refetch()} />;

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        <View style={{ gap: space.sm }}>
          <Label>Start a list</Label>
          <Field label="Name" value={name} placeholder="Photography" onChangeText={setName} />
          <Button
            label="Make the list"
            busy={create.isPending}
            disabled={!name.trim()}
            onPress={() => create.mutate({ name: name.trim() })}
          />
          {capped ? <Body tone="red">That&apos;s as many lists as you can save.</Body> : null}
          {/* What a saved list is *for* is the one thing the rows cannot show. */}
          <Body tone="ink-3">
            Kit you take again and again. Copy one into your bag on any trip and edit it there —
            the trip never changes what&apos;s saved here.
          </Body>
        </View>

        {kits.data.length === 0 ? <Empty>No saved lists yet.</Empty> : null}

        {kits.data.map((kit) => (
          <KitCard
            key={kit.id}
            kit={kit}
            busy={busy}
            onRename={(next) => rename.mutate({ kitId: kit.id, name: next })}
            onAdd={() => setItem({ kitId: kit.id, label: "", category: "other" })}
            onDelete={() => remove.mutate({ kitId: kit.id })}
            onStepItem={(itemId, delta) => stepItem.mutate({ itemId, delta })}
            onRemoveItem={(itemId) => removeItem.mutate({ itemId })}
          />
        ))}
      </ScrollView>

      <Sheet open={item !== null} onClose={() => setItem(null)}>
        <View style={{ padding: space.lg, gap: space.md }}>
          <Field
            label="Something to pack"
            value={item?.label ?? ""}
            autoFocus
            onChangeText={(label) => setItem((i) => (i ? { ...i, label } : i))}
          />
          <Dropdown
            label="Category"
            options={CATEGORY_OPTIONS}
            value={item?.category ?? "other"}
            onChange={(category) => setItem((i) => (i ? { ...i, category } : i))}
          />
          {addItem.isError ? <Body tone="red">{addItem.error.message}</Body> : null}
          <Button
            label="Add it"
            busy={addItem.isPending}
            onPress={() => {
              const label = item?.label.trim();
              if (!item || !label) return;
              // Counts are tuned by the row's own plus and minus, so a new
              // thing starts at one rather than asking a question up front.
              addItem.mutate({
                kitId: item.kitId,
                label,
                category: item.category,
                quantity: 1,
              });
            }}
          />
        </View>
      </Sheet>
    </>
  );
}
