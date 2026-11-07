/**
 * Asking people onto the trip (tickets 05, 146, #312): friends by name, anyone else by the link, one screen as the web's Invite.
 *
 * Why only friends are offered: somebody who has not agreed to know you would make a trip invite a backdoor friend
 * request (ticket 146). The server leaves out anyone already on the roster or asked.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";

import { FriendPickRow } from "@/components/roster/friend-pick-row";
import { ShareGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Button, Card, Empty, Failed, Heading, Loading, SectionTitle } from "@/components/system/ui";
import { MemberRow } from "@/components/roster/member-row";
import { trpc } from "@/lib/api";
import { inviteUrl } from "@/lib/config";
import { fonts, size, space } from "@/lib/theme";

export default function Invite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const ready = Number.isFinite(tripId);
  const { c } = useTheme();
  const queryClient = useQueryClient();

  const [picked, setPicked] = useState<string[]>([]);

  const panel = useQuery(trpc.invites.forTrip.queryOptions({ tripId }, { enabled: ready }));
  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  const refresh = () => queryClient.invalidateQueries({ queryKey: trpc.invites.forTrip.queryKey({ tripId }) });

  const send = useMutation({
    ...trpc.invites.send.mutationOptions(),
    onSuccess: () => {
      setPicked([]);
      void refresh();
    },
  });
  const reset = useMutation({ ...trpc.invites.resetLink.mutationOptions(), onSuccess: refresh });

  if (panel.isPending) return <Loading />;
  if (panel.isError) {
    return <Failed onRetry={() => panel.refetch()} />;
  }

  const noFriends = panel.data.candidates.length === 0;
  const isAdmin = trip.data?.role === "admin";
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
        <Heading>Invite friends</Heading>
        {noFriends ? (
          <Empty>Everyone you know on Floc is already on this trip, or has been asked.</Empty>
        ) : (
          <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
            {panel.data.candidates.map((person, i) => (
              <FriendPickRow
                key={person.id}
                name={person.name}
                on={picked.includes(person.id)}
                first={i === 0}
                onPress={() => toggle(person.id)}
              />
            ))}
          </Card>
        )}
        {picked.length > 0 ? (
          <Button
            label={`Send ${picked.length} invite${picked.length > 1 ? "s" : ""}`}
            busy={send.isPending}
            onPress={() => send.mutate({ tripId, userIds: picked })}
          />
        ) : null}
      </View>

      <View style={{ alignItems: "center", gap: space.xs }}>
        <View style={{ alignItems: "center", gap: space.xs }}>
          <View>
            <Button
              label="Share the link"
              variant={picked.length === 0 ? "primary" : "quiet"}
              fit="small"
              icon={(ink) => <ShareGlyph color={ink} />}
              onPress={() => void Share.share({ message: inviteUrl(panel.data.token) })}
            />
          </View>
          {isAdmin ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset invite link"
              hitSlop={8}
              disabled={reset.isPending}
              onPress={() =>
                Alert.alert(
                  "Reset the invite link?",
                  "The old link stops working for anyone still holding it. Everyone already on the trip stays.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Reset the link", style: "destructive", onPress: () => reset.mutate({ tripId }) },
                  ],
                )
              }
              style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", opacity: pressed || reset.isPending ? 0.6 : 1 })}
            >
              <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>Reset link</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {panel.data.pending.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <SectionTitle>Invited</SectionTitle>
          <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
            {panel.data.pending.map((person, i) => (
              <MemberRow key={person.id} name={person.name} you={false} admin={false} word="Invited" first={i === 0} />
            ))}
          </Card>
        </View>
      ) : null}
    </ScrollView>
  );
}
