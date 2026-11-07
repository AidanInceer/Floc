// Why: a stack, so a listing is a push with a back arrow; under the tab layout, so the bottom bar stays reachable.
import { Stack } from "expo-router";

import { Bell } from "@/components/notifications/bell";
import { useTheme } from "@/components/system/theme";
import { fonts, size } from "@/lib/theme";

export default function ExploreLayout() {
  const { c } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerRight: () => <Bell />,
        headerStyle: { backgroundColor: c.sheet },
        headerTintColor: c.ink,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: size.heading },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.paper },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Explore" }} />
    </Stack>
  );
}
