/**
 * Who is on the trip (ticket 291), the web's "Who's going" list.
 *
 * Two admin powers live here — remove and promote — hidden from a member and
 * refused again by the API if the screen is wrong (rule 6). Leaving and
 * inviting are open to every member (#312).
 *
 * A name opens a menu; View profile is how you meet somebody well enough to
 * ask them to be a friend (ticket 46).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { MemberMenu, confirmRemove } from "@/components/roster/member-menu";
import { MemberRow } from "@/components/roster/member-row";
import { AddPersonGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Button, Card, Failed, Heading, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { memberActions, type MemberAction } from "@/lib/roster/member-actions";
import { fonts, size, space } from "@/lib/theme";

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
  const [menu, setMenu] = useState<string | null>(null);

  const trip = useQuery(trpc.trips.get.queryOptions({ tripId }, { enabled: ready }));
  const invites = useQuery(trpc.invites.forTrip.queryOptions({ tripId }, { enabled: ready }));

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
  const members = trip.data.members;
  const picked = members.find((m) => m.userId === menu) ?? null;
  const pending = invites.data?.pending ?? [];

  const pick = (action: MemberAction) => {
    if (!picked) return;
    setMenu(null);
    if (action === "profile") router.push({ pathname: "/person/[userId]", params: { userId: picked.userId } });
    if (action === "promote") promote.mutate({ tripId, userId: picked.userId });
    if (action === "remove") confirmRemove(picked.name, () => remove.mutate({ tripId, userId: picked.userId }));
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
        <Heading>{`${members.length} going`}</Heading>
        <Button
          label="Invite"
          fit="small"
          icon={(ink) => <AddPersonGlyph color={ink} />}
          onPress={() => router.push(`/trip/${tripId}/invite` as never)}
        />
      </View>

      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        {members.map((m, i) => {
          const you = m.userId === me;
          const actions = memberActions({ viewerIsAdmin: isAdmin, you, role: m.role });
          return (
            <MemberRow
              key={m.userId}
              name={m.name}
              avatarIcon={m.avatarIcon}
              you={you}
              admin={m.role === "admin"}
              first={i === 0}
              onMore={actions.length ? () => setMenu(m.userId) : undefined}
            />
          );
        })}
        {pending.map((p) => (
          <MemberRow key={p.id} name={p.name} avatarIcon={p.avatarIcon} you={false} admin={false} word="Invited" first={false} />
        ))}
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Leave this trip"
        disabled={leave.isPending}
        hitSlop={8}
        onPress={() =>
          Alert.alert("Leave this trip?", "You'll need a new invite to come back.", [
            { text: "Cancel", style: "cancel" },
            { text: "Leave", style: "destructive", onPress: () => leave.mutate({ tripId }) },
          ])
        }
        style={({ pressed }) => ({ minHeight: 44, alignSelf: "center", justifyContent: "center", opacity: pressed || leave.isPending ? 0.6 : 1 })}
      >
        <Text style={{ color: c.red, fontFamily: fonts.sansBold, fontSize: size.body }}>Leave trip</Text>
      </Pressable>

      <MemberMenu
        name={picked?.name ?? null}
        actions={picked ? memberActions({ viewerIsAdmin: isAdmin, you: picked.userId === me, role: picked.role }) : []}
        onClose={() => setMenu(null)}
        onPick={pick}
      />
    </ScrollView>
  );
}
