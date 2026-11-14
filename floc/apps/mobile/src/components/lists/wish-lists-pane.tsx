/**
 * Wish lists (#623, ADR-049), the web's third Lists tab: invites waiting on you, then your lists as rows.
 * New wish list makes an empty list and opens it; you ask people from there.
 */
import { whoTone } from "@floc/core/people/who";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { FaceStack } from "@/components/system/face-stack";
import { PlusGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Card, Failed, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { fonts, radius, size, space } from "@/lib/theme";
import { countWord } from "@floc/core/text/count-word";

type Person = { id: string; name: string };
const faces = (people: Person[]) => people.map((p) => ({ userId: p.id, name: p.name, tone: whoTone(p.name) }));

export function WishListsPane() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const lists = useQuery(trpc.wishes.list.queryOptions());
  const settle = () => queryClient.invalidateQueries({ queryKey: trpc.wishes.list.queryKey() });
  const open = (listId: number) => router.push({ pathname: "/(app)/wish/[id]", params: { id: String(listId) } });
  const create = useMutation({ ...trpc.wishes.create.mutationOptions(), onSuccess: (id) => { void settle(); open(id); } });
  const respond = useMutation({
    ...trpc.wishes.respond.mutationOptions(),
    onSuccess: (_, { listId, accept }) => { void settle(); if (accept) open(listId); },
  });

  if (lists.isPending) return <Loading />;
  if (lists.isError) return <Failed onRetry={() => lists.refetch()} />;
  const { invites, lists: rows } = lists.data;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      {invites.map((invite) => (
        <InviteCard
          key={invite.id}
          from={invite.from?.name ?? "Someone"}
          title={invite.title}
          busy={respond.isPending}
          onAnswer={(accept) => respond.mutate({ listId: invite.id, accept })}
        />
      ))}
      <Button
        label="New wish list"
        variant={rows.length ? "quiet" : "primary"}
        icon={(ink) => <PlusGlyph color={ink} />}
        busy={create.isPending}
        onPress={() => create.mutate({ inviteIds: [] })}
      />
      {rows.length ? (
        <Card style={{ padding: 0, gap: 0 }}>
          {rows.map((list, i) => (
            <ListRow key={list.id} first={i === 0} title={list.title} count={list.itemCount} people={list.people} onPress={() => open(list.id)} />
          ))}
        </Card>
      ) : null}
      {create.isError ? <Body tone="red">{create.error.message}</Body> : null}
    </ScrollView>
  );
}

function InviteCard({ from, title, busy, onAnswer }: { from: string; title: string; busy: boolean; onAnswer: (accept: boolean) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.md, padding: space.lg, borderRadius: radius.md, borderWidth: 1, borderColor: c["pastel-blue-edge"], backgroundColor: c["pastel-blue"] }}>
      <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>
        <Text style={{ fontFamily: fonts.sansBold }}>{from}</Text> invited you to <Text style={{ fontFamily: fonts.sansBold }}>{title}</Text>
      </Text>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Button label="Join" fit="small" busy={busy} onPress={() => onAnswer(true)} />
        <Button label="Decline" fit="small" variant="quiet" disabled={busy} onPress={() => onAnswer(false)} />
      </View>
    </View>
  );
}

function ListRow({ first, title, count, people, onPress }: { first: boolean; title: string; count: number; people: Person[]; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${countWord(count, "thing")}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        minHeight: 56,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderTopColor: c.rule,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{title}</Text>
        <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small }}>{countWord(count, "thing")}</Text>
      </View>
      <FaceStack faces={faces(people)} diameter={24} />
    </Pressable>
  );
}
