/**
 * Asking people onto the trip (tickets 05, 146, #312): friends by name, anyone else by the link, one screen as the web's Invite.
 *
 * Why only friends are offered: somebody who has not agreed to know you would make a trip invite a backdoor friend
 * request (ticket 146). The server leaves out anyone already on the roster or asked.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, Share, View } from "react-native";

import { ShareGlyph } from "@/components/system/glyphs";
import { PersonRow } from "@/components/trip/person-row";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Divider, Empty, Failed, Loading, SectionTitle } from "@/components/system/ui";
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

  const panel = useQuery(trpc.invites.forTrip.queryOptions({ tripId }, { enabled: ready }));

  const send = useMutation({
    ...trpc.invites.send.mutationOptions(),
    onSuccess: () => {
      setPicked([]);
      queryClient.invalidateQueries({ queryKey: trpc.invites.forTrip.queryKey({ tripId }) });
    },
  });

  if (panel.isPending) return <Loading />;
  if (panel.isError) {
    return <Failed onRetry={() => panel.refetch()} />;
  }

  const noFriends = panel.data.candidates.length === 0;
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
        <SectionTitle>Your friends</SectionTitle>
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
                <PersonRow name={person.name} avatarIcon={person.avatarIcon}>
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

      <View style={{ gap: space.sm }}>
        <Divider />
        <Body tone="ink-2">Anyone with the link can join the trip.</Body>
        <View style={{ flexDirection: "row" }}>
          <Button
            label="Share the link"
            variant={noFriends ? "primary" : "quiet"}
            fit="small"
            icon={(ink) => <ShareGlyph color={ink} />}
            onPress={() => void Share.share({ message: inviteUrl(panel.data.token) })}
          />
        </View>
      </View>

      {panel.data.pending.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <SectionTitle>Asked, not answered</SectionTitle>
          {panel.data.pending.map((person) => (
            <PersonRow key={person.id} name={person.name} avatarIcon={person.avatarIcon} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
