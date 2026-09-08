/**
 * Asking people onto the trip (tickets 05, 146) — the two doors, one screen.
 *
 * THE LINK AND THE NAMED INVITE ARE DIFFERENT THINGS. A link is a secret
 * anybody may forward; an invite is a row addressed to one person, and it
 * turns up on their trips list rather than in their inbox. Both are here
 * because they answer the same question for the person doing the asking.
 *
 * ONLY FRIENDS ARE OFFERED. Somebody who has not agreed to know you would make
 * a trip invite a backdoor friend request (ticket 146). Anyone already on the
 * roster or already asked is filtered out on the server, so this list is what
 * is left rather than everything with the used ones greyed out.
 *
 * ADMIN-ONLY (rule 6). A member is told so, not shown dead buttons.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { PersonRow } from "@/components/person-row";
import { useTheme } from "@/components/theme";
import { Body, Button, Card, Empty, Failed, Label, Loading } from "@/components/ui";
import { trpc } from "@/lib/api";
import { inviteUrl } from "@/lib/config";
import { space } from "@/lib/theme";
import { useLocalSearchParams } from "expo-router";

export default function Invite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const ready = Number.isFinite(tripId);
  const { c } = useTheme();
  const queryClient = useQueryClient();

  const [picked, setPicked] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const panel = useQuery(trpc.invites.forTrip.queryOptions({ tripId }, { enabled: ready }));

  const send = useMutation({
    ...trpc.invites.send.mutationOptions(),
    onSuccess: () => {
      setPicked([]);
      queryClient.invalidateQueries({ queryKey: trpc.invites.forTrip.queryKey({ tripId }) });
    },
  });

  if (panel.isPending) return <Loading />;
  // Admin-only on the server, so a member's refusal arrives here as an error.
  // What is missing is one of the two things text still carries.
  if (panel.isError) {
    return <Failed onRetry={() => panel.refetch()} />;
  }

  const link = inviteUrl(panel.data.token);
  const toggle = (userId: string) =>
    setPicked((was) =>
      was.includes(userId) ? was.filter((v) => v !== userId) : [...was, userId],
    );

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg }}
    >
      <View style={{ gap: space.sm }}>
        <Label>Anyone with the link</Label>
        <Card>
          <Body>{link}</Body>
        </Card>
        <Button
          label={copied ? "Copied" : "Copy the link"}
          variant="quiet"
          onPress={() => {
            void Clipboard.setStringAsync(link);
            setCopied(true);
          }}
        />
        <Body tone="ink-3">
          Anybody holding this can join. Send it to people, not to a group nobody reads.
        </Body>
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Ask a friend by name</Label>
        {panel.data.candidates.length === 0 ? (
          <Empty>Nobody left to ask.</Empty>
        ) : (
          panel.data.candidates.map((person) => {
            const on = picked.includes(person.id);
            return (
              <Pressable
                key={person.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={person.name}
                onPress={() => toggle(person.id)}
              >
                <PersonRow name={person.name} avatarUrl={person.avatarUrl}>
                  {/* The word, not a tick alone — a mark by itself says nothing
                      to anybody who cannot see it (#204). */}
                  <Body tone={on ? "ink" : "ink-3"}>{on ? "Asking" : "Ask"}</Body>
                </PersonRow>
              </Pressable>
            );
          })
        )}
        {picked.length > 0 ? (
          <Button
            label={`Invite ${picked.length}`}
            busy={send.isPending}
            onPress={() => send.mutate({ tripId, userIds: picked })}
          />
        ) : null}
      </View>

      {panel.data.pending.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <Label>Asked, not answered</Label>
          {panel.data.pending.map((person) => (
            <PersonRow key={person.id} name={person.name} avatarUrl={person.avatarUrl} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
