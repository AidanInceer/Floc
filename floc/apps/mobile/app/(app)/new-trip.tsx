/**
 * Creating a trip (ticket 291).
 *
 * The smallest thing that can exist is a name (#01). Dates are optional and
 * never guessed — a trip with no dates is a normal trip (rule 9), so the
 * fields are simply left empty and the API is told `null`.
 */
import { TEXT_CAPS } from "@floc/core/text/text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Body, Button, Field, Screen } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { askForPushOnce } from "@/lib/push/push";
import { space } from "@/lib/theme";

/** The API refuses anything that is not `YYYY-MM-DD`; an empty box means "not set", not "invalid". */
const asDate = (value: string) => (value.trim() === "" ? null : value.trim());

export default function NewTrip() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const create = useMutation({
    ...trpc.trips.create.mutationOptions(),
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
      router.replace({ pathname: "/trip/[id]", params: { id: trip.id } });
      void askForPushOnce();
    },
  });

  return (
    <Screen>
      <View style={{ gap: space.md }}>
        <Field label="Name" value={name} onChangeText={setName} maxLength={TEXT_CAPS.tripName} autoFocus />
        <Field
          label="Starts (YYYY-MM-DD, optional)"
          value={startDate}
          onChangeText={setStartDate}
          placeholder="2026-05-01"
          autoCapitalize="none"
        />
        <Field
          label="Ends (YYYY-MM-DD, optional)"
          value={endDate}
          onChangeText={setEndDate}
          placeholder="2026-05-08"
          autoCapitalize="none"
        />

        {create.isError ? <Body tone="red">{create.error.message}</Body> : null}

        <Button
          label="Create"
          busy={create.isPending}
          onPress={() =>
            create.mutate({
              name: name.trim(),
              startDate: asDate(startDate),
              endDate: asDate(endDate),
            })
          }
        />
      </View>
    </Screen>
  );
}
