/**
 * Notifications (#344) — the phone's half of `/inbox`. The server writes each
 * line, so a notification reads the same here as in a browser.
 */
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { FlatList, Pressable, View } from "react-native";

import { commentTime } from "@floc/core/notes/notes";
import { phoneRoute } from "@floc/core/notifications/notification-href";

import { useTheme } from "@/components/system/theme";
import { Body, Empty, Failed, Label, Loading } from "@/components/system/ui";
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

  if (pages.isPending) return <Loading />;
  if (pages.isError) return <Failed onRetry={() => pages.refetch()} />;

  const items = pages.data.pages.flatMap((page) => page.items);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: space.lg, gap: space.sm }}
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
            backgroundColor: item.read ? c.sheet : c["pen-soft"],
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
