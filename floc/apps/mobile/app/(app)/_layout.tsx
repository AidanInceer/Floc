/**
 * Everything behind the sign-in wall (ticket 289). The redirect itself lives in
 * the root layout, so this is only the stack the signed-in screens push onto.
 */
import * as Notifications from "expo-notifications";
import { Stack, useRouter, type Href } from "expo-router";
import { useEffect } from "react";

import { useTheme } from "@/components/system/theme";
import { client, queryClient, trpc } from "@/lib/api";
import { registerThisPhone } from "@/lib/push/push";
import { pushTap } from "@/lib/push/push-tap";

/** A tapped push opens its thing and marks what it carried read (#345). */
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
  usePushTaps();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.sheet },
        headerTintColor: c.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.paper },
      }}
    >
      {/* The bottom bar owns its own headers; a trip is pushed over the whole
          thing, so it never draws under the bar (ticket 302). */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="new-trip" options={{ title: "New trip", presentation: "modal" }} />
      <Stack.Screen name="join" options={{ title: "Join a trip", presentation: "modal" }} />
      <Stack.Screen name="archived" options={{ title: "Archived trips" }} />
      <Stack.Screen name="friends" options={{ title: "Friends" }} />
      {/* One level under You, not a fourth tab — the bar is the three places
          that are not a trip (#302, #230). */}
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="kits" options={{ title: "Saved lists" }} />
      <Stack.Screen name="inbox" options={{ title: "Notifications" }} />
      {/* The title is the person's name, so the screen sets it once it knows one. */}
      <Stack.Screen name="person/[userId]" options={{ title: "Profile" }} />
    </Stack>
  );
}
