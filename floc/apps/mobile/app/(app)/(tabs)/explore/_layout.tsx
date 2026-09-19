/**
 * Explore's own stack — the list, and the listing you opened (direction C).
 *
 * A STACK BECAUSE THERE IS NOW A SECOND LEVEL. The tab used to be one screen,
 * so it needed no navigator. Opening a listing is a push, and a push wants the
 * back arrow and the title that a stack gives for free; `[preset]` names itself
 * from the listing it drew.
 *
 * INSIDE THE BAR, NOT OVER IT. This stack lives under the tab layout, so the
 * bottom bar stays reachable while you read a listing — the same rule a trip
 * follows, for the same reason: leaving should never mean hunting for back.
 */
import { Stack } from "expo-router";

import { Bell } from "@/components/notifications/bell";
import { useTheme } from "@/components/system/theme";

export default function ExploreLayout() {
  const { c } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerRight: () => <Bell />,
        headerStyle: { backgroundColor: c.sheet },
        headerTintColor: c.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.paper },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Explore" }} />
    </Stack>
  );
}
