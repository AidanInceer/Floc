/** Plan the next one (#443): a new undated trip, the same group ticked, each ticked person invited to their inbox. Nothing copied. */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Sheet } from "../../system/sheet";
import { Body, Button, Field, Heading, Label } from "../../system/ui";
import { GroupChoice } from "../../social/group-people";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export function NextTripSheet({ open, onClose, others }: { open: boolean; onClose: () => void; others: { id: string; name: string }[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [left, setLeft] = useState<ReadonlySet<string>>(new Set());
  const create = useMutation({
    ...trpc.trips.create.mutationOptions(),
    onSuccess: (trip) => {
      void queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
      onClose();
      router.push(`/trip/${trip.id}` as never);
    },
  });
  const toggle = (id: string) => setLeft((now) => {
    const next = new Set(now);
    if (!next.delete(id)) next.add(id);
    return next;
  });
  const start = () => create.mutate({ name, friendIds: others.map((p) => p.id).filter((id) => !left.has(id)) });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      footer={<Button label="Start trip" busy={create.isPending} disabled={name.trim() === ""} onPress={start} />}
    >
      <View style={{ gap: space.lg }}>
        <Heading>Plan the next one</Heading>
        <Field label="Trip name" value={name} onChangeText={setName} autoCapitalize="sentences" />
        {others.length > 0 ? (
          <View style={{ gap: space.xs }}>
            <Label>Invite</Label>
            {others.map((p) => (
              <GroupChoice key={p.id} name={p.name} face checked={!left.has(p.id)} onPress={() => toggle(p.id)} />
            ))}
          </View>
        ) : null}
        {create.isError ? <Body tone="red">The trip could not be started. Try again.</Body> : null}
      </View>
    </Sheet>
  );
}
