/**
 * One wish list on the phone (#623, ADR-049): who is on it, one field to add an idea, a place or a link, and the
 * items as Saved rows. Start trip asks the list's people along; any member may add, remove, rename, invite or leave.
 */
import { linkShown, readWishLink, WISH_CAPS } from "@floc/core/lists/wish-list";
import { countryName } from "@floc/core/people/countries";
import { peopleCount, toggleTripPeople, type TripPeopleSelection } from "@floc/core/people/group-ticks";
import { whoTone } from "@floc/core/people/who";
import { PRESET_TRIPS } from "@floc/core/trip/explore/preset-trips";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";

import { SavedRow, SavedSection } from "@/components/lists/saved-row";
import { TripPeoplePicker } from "@/components/social/trip-people-picker";
import { FaceStack } from "@/components/system/face-stack";
import { MoreGlyph } from "@/components/system/glyphs";
import { Body, Button, Empty, Failed, Field, IconButton, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

const byId = new Map(PRESET_TRIPS.map((t) => [t.id, t]));
const looksLikeLink = (typed: string) => !/\s/.test(typed.trim()) && /\./.test(typed) && readWishLink(typed) !== null;

export default function WishListScreen() {
  const listId = Number(useLocalSearchParams<{ id: string }>().id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const list = useQuery(trpc.wishes.get.queryOptions({ listId }));
  const [typed, setTyped] = useState("");
  const [label, setLabel] = useState("");
  const [inviting, setInviting] = useState(false);
  const [picked, setPicked] = useState<TripPeopleSelection>(() => ({ ticked: new Set(), groups: new Set() }));
  const settle = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.wishes.get.queryKey({ listId }) }),
      queryClient.invalidateQueries({ queryKey: trpc.wishes.list.queryKey() }),
    ]);
  const add = useMutation({ ...trpc.wishes.addItem.mutationOptions(), onSuccess: () => { setTyped(""); setLabel(""); void settle(); } });
  const remove = useMutation({ ...trpc.wishes.removeItem.mutationOptions(), onSuccess: () => void settle() });
  const invite = useMutation({
    ...trpc.wishes.invite.mutationOptions(),
    onSuccess: () => { setInviting(false); setPicked({ ticked: new Set(), groups: new Set() }); void settle(); },
  });
  const leave = useMutation({ ...trpc.wishes.leave.mutationOptions(), onSuccess: () => { void settle(); router.back(); } });

  if (list.isPending) return <Loading />;
  if (list.isError) return <Failed onRetry={() => list.refetch()} />;
  if (!list.data) return <Empty>This wish list is not here.</Empty>;
  const data = list.data;
  const link = looksLikeLink(typed);
  const start = (name: string) => router.push({ pathname: "/(app)/new-trip", params: { name, wish: String(listId) } });
  const error = add.error ?? invite.error ?? remove.error ?? leave.error;

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: data.title }} />
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <FaceStack faces={data.members.map((p) => ({ userId: p.id, name: p.name, tone: whoTone(p.name) }))} diameter={24} />
          {data.invited.length ? <Body tone="ink-2">{peopleCount(data.invited.length)} asked</Body> : null}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Field label="Add an idea, a place or a link" value={typed} onChangeText={setTyped} maxLength={WISH_CAPS.url} autoCapitalize="none" />
        {link ? <Field label="Label" value={label} onChangeText={setLabel} maxLength={WISH_CAPS.label} /> : null}
        <Button
          label={link ? "Add link" : "Add"}
          busy={add.isPending}
          disabled={!typed.trim()}
          onPress={() =>
            add.mutate({ listId, item: link ? { kind: "link", url: typed.trim(), label: label.trim() || null } : { kind: "text", text: typed.trim() } })
          }
        />
      </View>

      {data.items.length ? (
        <SavedSection title="On the list" count={data.items.length}>
          {data.items.map((item, i) => {
            const trip = item.presetId ? byId.get(item.presetId) : undefined;
            const title = trip?.title ?? (item.countryCode ? countryName(item.countryCode) : item.url ? linkShown(item.label, item.url) : (item.text ?? ""));
            const kind = trip ? "Explore trip" : item.countryCode ? "Country" : item.url ? linkShown(null, item.url) : "Idea";
            const by = item.addedBy ? ` · ${item.addedBy.name.split(/\s+/)[0]}` : "";
            return (
              <SavedRow
                key={item.id}
                first={i === 0}
                title={title}
                figures={`${kind}${by}`}
                heart={
                  <IconButton
                    label={`Options for ${title}`}
                    onPress={() =>
                      Alert.alert(title, undefined, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Remove from list", style: "destructive", onPress: () => remove.mutate({ listId, itemId: item.id }) },
                      ])
                    }
                  >
                    {(color) => <MoreGlyph color={color} />}
                  </IconButton>
                }
                onOpen={() =>
                  trip
                    ? router.push({ pathname: "/explore/[preset]", params: { preset: trip.id } })
                    : item.url
                      ? void Linking.openURL(item.url)
                      : item.countryCode
                        ? router.push({ pathname: "/explore", params: { country: item.countryCode } })
                        : undefined
                }
                onStart={() =>
                  trip ? router.push({ pathname: "/explore/[preset]", params: { preset: trip.id, start: "1", wish: String(listId) } }) : start(title)
                }
              />
            );
          })}
        </SavedSection>
      ) : null}

      {inviting ? (
        <View style={{ gap: space.md }}>
          <TripPeoplePicker ticked={picked.ticked} onToggle={(ids, groupId) => setPicked((now) => toggleTripPeople(now, ids, groupId))} />
          <Button
            label="Send invites"
            busy={invite.isPending}
            disabled={picked.ticked.size === 0}
            onPress={() => invite.mutate({ listId, inviteIds: [...picked.ticked] })}
          />
        </View>
      ) : (
        <Button label="Invite" variant="quiet" onPress={() => setInviting(true)} />
      )}
      {error ? <Body tone="red">{error.message}</Body> : null}
      <Button label="Leave wish list" variant="danger" busy={leave.isPending} onPress={() =>
          Alert.alert(data.members.length > 1 ? "Leave this wish list? The others keep it." : "Leave this wish list? You are the last one on it, so it goes.", undefined, [
            { text: "Cancel", style: "cancel" },
            { text: "Leave wish list", style: "destructive", onPress: () => leave.mutate({ listId }) },
          ])
        } />
    </ScrollView>
  );
}
