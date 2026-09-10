/**
 * Joining by an invite link (ticket 291).
 *
 * The token, never the trip id (#05). A trip id is guessable and a token is
 * not, which is the entire reason the column exists. A token that resolves to
 * nothing answers the same way as one for a deleted trip — nothing here tells
 * anybody which they typed.
 *
 * IT SHOWS THE TRIP BEFORE YOU JOIN IT. A pasted link is a string; what the
 * person actually wants to know is whose trip it is and when. `invites.preview`
 * reads without a session and carries a name, some dates and a host — no
 * roster, no money, no notes, because whoever holds a forwarded link is not a
 * member yet (ticket 147).
 */
import { formatDateRange } from "@floc/core/dates/dates";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Body, Button, Card, Field, Screen } from "@/components/system/ui";
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

  const token = tokenFrom(link);
  // Only once there is something worth asking about — a half-typed link is not
  // a question, and a spinner under every keystroke reads as a failure.
  const preview = useQuery(
    trpc.invites.preview.queryOptions({ token }, { enabled: token.length > 8 }),
  );

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
        {preview.data ? (
          <Card>
            <Body bold>{preview.data.name}</Body>
            <Body tone="ink-2">
              {formatDateRange(preview.data.startDate, preview.data.endDate)}
            </Body>
            {preview.data.hostName ? (
              <Body tone="ink-3">{preview.data.hostName}&apos;s trip</Body>
            ) : null}
          </Card>
        ) : null}
        {problem ? <Body tone="red">{problem}</Body> : null}
        <Button
          label="Join"
          busy={join.isPending}
          onPress={() => {
            setProblem(null);
            join.mutate({ token });
          }}
        />
      </View>
    </Screen>
  );
}
