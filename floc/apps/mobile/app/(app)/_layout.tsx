/**
 * Everything behind the sign-in wall (ticket 289). The redirect itself lives in
 * the root layout, so this is only the stack the signed-in screens push onto.
 */
import { Stack } from "expo-router";

import { useTheme } from "@/components/theme";

export default function AppLayout() {
  const { c } = useTheme();
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
    </Stack>
  );
}
