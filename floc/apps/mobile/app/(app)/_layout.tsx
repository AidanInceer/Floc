/**
 * Everything behind the sign-in wall (ticket 289). The redirect itself lives in
 * the root layout, so this is only the stack the signed-in screens push onto.
 */
import { Stack } from "expo-router";

import { useTheme } from "@/components/system/theme";

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
      <Stack.Screen name="archived" options={{ title: "Archived trips" }} />
      <Stack.Screen name="friends" options={{ title: "Friends" }} />
      {/* One level under You, not a fourth tab — the bar is the three places
          that are not a trip (#302, #230). */}
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="kits" options={{ title: "Saved lists" }} />
      {/* The title is the person's name, so the screen sets it once it knows one. */}
      <Stack.Screen name="person/[userId]" options={{ title: "Profile" }} />
    </Stack>
  );
}
