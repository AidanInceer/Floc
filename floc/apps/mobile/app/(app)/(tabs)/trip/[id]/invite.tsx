/**
 * Asking friends onto the trip by name (tickets 05, 146).
 *
 * NO LINK HERE. A link is a secret anybody may forward; an invite is a row
 * addressed to one person. They are two jobs, and "Share trip" on the group
 * card already owns the link — this screen is only the named ask.
 *
 * ONLY FRIENDS ARE OFFERED. Somebody who has not agreed to know you would make
 * a trip invite a backdoor friend request (ticket 146). Anyone already on the
 * roster or already asked is filtered out on the server, so this list is what
 * is left rather than everything with the used ones greyed out.
 *
 * ADMIN-ONLY (rule 6). A member is told so, not shown dead buttons.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { PersonRow } from "@/components/trip/person-row";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Empty, Failed, Label, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";
import { useLocalSearchParams } from "expo-router";

export default function Invite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const ready = Number.isFinite(tripId);
  const { c } = useTheme();
  const queryClient = useQueryClient();

  const [picked, setPicked] = useState<string[]>([]);

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
        <Label>Your friends</Label>
        {panel.data.candidates.length === 0 ? (
          <Empty>No friends to ask — everyone you know is already on this trip, or asked.</Empty>
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
