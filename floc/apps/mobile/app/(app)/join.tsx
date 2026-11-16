import { formatDateRange } from "@floc/core/dates/dates";
import { INVITE_LINK_DAYS } from "@floc/core/trip/group/invite-link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Body, Button, Card, Field, Screen } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { askForPushOnce } from "@/lib/push/push";
import { space } from "@/lib/theme";

const DEAD_LINK = `This link no longer works. An invite link works for ${INVITE_LINK_DAYS} days. Ask whoever sent it for a fresh one.`;

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
  const preview = useQuery(
    trpc.invites.preview.queryOptions({ token }, { enabled: token.length > 8 }),
  );

  const join = useMutation({
    ...trpc.trips.join.mutationOptions(),
    onSuccess: (trip) => {
      if (!trip) {
        setProblem(DEAD_LINK);
        return;
      }
      queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
      router.replace({ pathname: "/trip/[id]", params: { id: trip.id } });
      void askForPushOnce();
    },
    onError: (error) =>
      setProblem(error.data?.code === "BAD_REQUEST" ? error.message : DEAD_LINK),
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
