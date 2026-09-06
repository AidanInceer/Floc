/**
 * Joining by an invite link (ticket 291).
 *
 * The token, never the trip id (#05). A trip id is guessable and a token is
 * not, which is the entire reason the column exists. A token that resolves to
 * nothing answers the same way as one for a deleted trip — nothing here tells
 * anybody which they typed.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Body, Button, Field, Screen } from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

/** People paste the whole link, not the token out of it. */
function tokenFrom(pasted: string): string {
  const trimmed = pasted.trim();
  const match = trimmed.match(/\/invite\/([^/?#\s]+)/);
  return match ? match[1] : trimmed;
}

export default function Join() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [link, setLink] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const join = useMutation({
    ...trpc.trips.join.mutationOptions(),
    onSuccess: (trip) => {
      if (!trip) {
        setProblem("That link doesn't work any more.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
      router.replace({ pathname: "/trip/[id]", params: { id: trip.id } });
    },
    onError: () => setProblem("That link doesn't work any more."),
  });

  return (
    <Screen>
      <View style={{ gap: space.md }}>
        <Field
          label="Invite link"
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          placeholder="https://floc.app/invite/…"
        />
        {problem ? <Body tone="red">{problem}</Body> : null}
        <Button
          label="Join"
          busy={join.isPending}
          onPress={() => {
            setProblem(null);
            join.mutate({ token: tokenFrom(link) });
          }}
        />
      </View>
    </Screen>
  );
}
