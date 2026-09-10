/**
 * Who is on the trip (ticket 291).
 *
 * EXACTLY FOUR ADMIN POWERS (rule 6). Two are reachable here — remove and
 * promote — and both are hidden from a member, then refused again by the API
 * if the screen is wrong. Hiding a control is a courtesy; the gate is the
 * server's.
 *
 * Leaving is NOT one of the four. Every member can leave, including the last
 * admin, so it sits outside the admin block deliberately.
 *
 * INVITING IS HERE NOW. It used to point at the website, on the grounds that
 * it composed an email — but a named invite sends no mail on either client, it
 * turns up on the invitee's trips list. The share link and the friend picker
 * both live on their own screen, because both are an admin's rare job and the
 * roster is the frequent one.
 *
 * A NAME OPENS A PROFILE. Which is how you meet somebody well enough to ask
 * them to be a friend — a co-traveller is already inside one of your rings, so
 * that profile is one you may see (ticket 46).
 */
import { whoTone } from "@floc/core/people/who";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { Seat } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Card, Failed, Label, Loading, Pill } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { space } from "@/lib/theme";

export default function Roster() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  // A screen keeps rendering for a frame while it leaves, and `id` is gone by
  // then: NaN goes down the wire as null and the server rightly refuses it.
  const ready = Number.isFinite(tripId);
  const router = useRouter();
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.trips.get.queryKey({ tripId }) });

  const remove = useMutation({ ...trpc.roster.remove.mutationOptions(), onSuccess: invalidate });
  const promote = useMutation({ ...trpc.roster.promote.mutationOptions(), onSuccess: invalidate });
  const leave = useMutation({
    ...trpc.trips.leave.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
      router.replace("/trips");
    },
  });

  if (trip.isPending) return <Loading />;
  if (trip.isError) return <Failed onRetry={() => trip.refetch()} />;

  const isAdmin = trip.data.role === "admin";
  const me = session?.user.id;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Label>On this trip</Label>
        {trip.data.members.map((m) => {
          const tone = whoTone(m.name);
          return (
            <Card key={m.userId}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  m.userId === me ? m.name : `Open ${m.name}'s profile`
                }
                disabled={m.userId === me}
                onPress={() =>
                  router.push({
                    pathname: "/person/[userId]",
                    params: { userId: m.userId },
                  })
                }
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <Seat
                    initial={m.name.slice(0, 1).toUpperCase()}
                    ground={c[tone] ?? c["sheet-2"]}
                    ink={c[`${tone}-ink`] ?? c.ink}
                  />
                  <View style={{ flex: 1, gap: space.xs }}>
                    <Body bold>{m.name}</Body>
                    {/* A functional attribute for a group picking dinner — shown
                        only when they chose to share it (#46). */}
                    {m.dietary ? <Body tone="ink-2">{m.dietary}</Body> : null}
                  </View>
                  {m.role === "admin" ? <Pill word="Admin" tone="peri" /> : null}
                </View>
              </Pressable>

              {isAdmin && m.userId !== me ? (
                <View style={{ flexDirection: "row", gap: space.sm }}>
                  {m.role !== "admin" ? (
                    <Button
                      label="Make admin"
                      variant="quiet"
                      onPress={() => promote.mutate({ tripId, userId: m.userId })}
                    />
                  ) : null}
                  <Button
                    label="Remove"
                    variant="danger"
                    onPress={() =>
                      Alert.alert(`Remove ${m.name}?`, "They lose access to this trip.", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: () => remove.mutate({ tripId, userId: m.userId }),
                        },
                      ])
                    }
                  />
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>

      {isAdmin ? (
        <Button
          label="Invite people"
          onPress={() => router.push(`/trip/${tripId}/invite` as never)}
        />
      ) : (
        // What is missing is one of the two things text still carries (rule 6).
        <Body tone="ink-3">Only an admin can ask somebody new onto this trip.</Body>
      )}

      <Button
        label="Leave this trip"
        variant="danger"
        busy={leave.isPending}
        onPress={() =>
          Alert.alert("Leave this trip?", "You'll need a new invite to come back.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: () => leave.mutate({ tripId }),
            },
          ])
        }
      />
    </ScrollView>
  );
}
