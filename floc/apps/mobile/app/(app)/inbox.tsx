import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { Pressable, SectionList, Text, View } from "react-native";

import { commentTime } from "@floc/core/notes/notes";
import { groupByTrip, lineUnderTrip, planFirst } from "@floc/core/notifications/by-trip";
import { phoneRoute } from "@floc/core/notifications/notification-href";

import { ChangeWords } from "@/components/notifications/change-words";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Empty, Failed, Label, Loading, SectionTitle } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { fonts, radius, size, space } from "@/lib/theme";

export default function Inbox() {
  const router = useRouter();
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const pages = useInfiniteQuery(
    trpc.notifications.list.infiniteQueryOptions(
      {},
      { getNextPageParam: (page) => page.next, initialCursor: null },
    ),
  );
  const open = useMutation({
    ...trpc.notifications.open.mutationOptions(),
    onSuccess: (href) => {
      queryClient.invalidateQueries({ queryKey: trpc.notifications.pathKey() });
      if (href) router.push(phoneRoute(href) as Href);
    },
  });

  const unseen = useQuery(trpc.notifications.unread.queryOptions()).data ?? 0;
  const { mutate: see } = useMutation({
    ...trpc.notifications.seen.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.notifications.unread.queryKey() }),
  });
  useEffect(() => {
    if (unseen > 0) see();
  }, [unseen, see]);

  const readAll = useMutation({
    ...trpc.notifications.readAll.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.notifications.pathKey() }),
  });

  if (pages.isPending) return <Loading />;
  if (pages.isError) return <Failed onRetry={() => pages.refetch()} />;

  const items = pages.data.pages.flatMap((page) => page.items);
  const anyUnread = items.some((item) => !item.read);
  const sections = pages.data.pages.flatMap((page, index) =>
    groupByTrip(page.items).map((group) => ({ key: `${index}-${group.tripId ?? "none"}`, title: group.tripName, data: planFirst(group.items) })),
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ padding: space.lg }}
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      ListHeaderComponent={
        anyUnread ? (
          <View style={{ alignItems: "flex-end" }}>
            <Button
              label="Mark all as read"
              variant="quiet"
              fit="small"
              busy={readAll.isPending}
              onPress={() => readAll.mutate()}
            />
          </View>
        ) : null
      }
      ListEmptyComponent={<Empty>Nothing new.</Empty>}
      onEndReached={() => {
        if (pages.hasNextPage && !pages.isFetchingNextPage) void pages.fetchNextPage();
      }}
      renderSectionHeader={({ section }) =>
        section.title ? (
          <View style={{ paddingTop: space.md, paddingBottom: space.sm }}>
            <SectionTitle>{section.title}</SectionTitle>
          </View>
        ) : (
          <View style={{ height: space.md }} />
        )
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole={item.href === null ? "text" : "button"}
          disabled={item.href === null}
          onPress={() => open.mutate({ id: item.id })}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: space.md,
            padding: space.md,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: c.rule,
            backgroundColor: item.read ? c.sheet : c["pen-2"],
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View style={{ flex: 1, gap: space.xs }}>
            <Body tone={item.read ? "ink-2" : "ink"}>{lineUnderTrip(item.text, item.tripName)}</Body>
            {item.was || item.now ? <ChangeWords was={item.was} now={item.now} /> : null}
            <Label>{commentTime(new Date(item.at))}</Label>
          </View>
          {item.share ? (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.label }}>Your share</Text>
              <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{item.share}</Text>
            </View>
          ) : null}
          {item.read ? null : <Label>New</Label>}
        </Pressable>
      )}
    />
  );
}
