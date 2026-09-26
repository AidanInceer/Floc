/**
 * Notifications (#344) — the phone's half of `/inbox`. The server writes each
 * line, so a notification reads the same here as in a browser.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, View } from "react-native";

import { commentTime } from "@floc/core/notes/notes";
import { phoneRoute } from "@floc/core/notifications/notification-href";

import { useTheme } from "@/components/system/theme";
import { Body, Button, Empty, Failed, Label, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { radius, space } from "@/lib/theme";

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

  // Why: the bell counts unseen, and arriving here is the seeing — as on the web (#403).
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

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: space.lg, gap: space.sm }}
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
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => open.mutate({ id: item.id })}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: space.md,
            padding: space.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: c.rule,
            backgroundColor: item.read ? c.sheet : c["pen-2"],
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View style={{ flex: 1, gap: space.xs }}>
            <Body tone={item.read ? "ink-2" : "ink"}>{item.text}</Body>
            <Label>{commentTime(new Date(item.at))}</Label>
          </View>
          {item.read ? null : <Label>New</Label>}
        </Pressable>
      )}
    />
  );
}
