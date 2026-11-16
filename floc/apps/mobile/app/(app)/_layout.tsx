import * as Notifications from "expo-notifications";
import { Stack, useRouter, type Href } from "expo-router";
import { useEffect } from "react";

import { useTheme } from "@/components/system/theme";
import { useReducedMotion } from "@/components/system/use-reduced-motion";
import { client, queryClient, trpc } from "@/lib/api";
import { usePageViews } from "@/components/consent/use-page-views";
import { registerThisPhone } from "@/lib/push/push";
import { pushTap } from "@/lib/push/push-tap";

function usePushTaps() {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    void registerThisPhone().catch(() => undefined);
  }, []);

  useEffect(() => {
    const tap = pushTap(lastResponse?.notification.request.content.data);
    if (!tap) return;
    router.push(tap.route as Href);
    void Promise.all(tap.ids.map((id) => client.notifications.open.mutate({ id }))).then(() =>
      queryClient.invalidateQueries({ queryKey: trpc.notifications.pathKey() }),
    );
  }, [lastResponse, router]);
}

export default function AppLayout() {
  const { c } = useTheme();
  const reducedMotion = useReducedMotion();
  usePushTaps();
  usePageViews();
  return (
    <Stack
      screenOptions={{
        animation: reducedMotion === false ? "default" : "none",
        headerStyle: { backgroundColor: c.sheet },
        headerTintColor: c.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.paper },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="new-trip" options={{ title: "New trip", presentation: "modal" }} />
      <Stack.Screen name="join" options={{ title: "Join a trip", presentation: "modal" }} />
      <Stack.Screen name="archived" options={{ title: "Archived trips" }} />
      <Stack.Screen name="friends" options={{ title: "Friends" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="lists" options={{ title: "Lists" }} />
      <Stack.Screen name="bookings" options={{ title: "Bookings" }} />
      <Stack.Screen name="wish/[id]" options={{ title: "" }} />
      <Stack.Screen name="inbox" options={{ title: "Notifications" }} />
      <Stack.Screen name="person/[userId]" options={{ title: "Profile" }} />
    </Stack>
  );
}
