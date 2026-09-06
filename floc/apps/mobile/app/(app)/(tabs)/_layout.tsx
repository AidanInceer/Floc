/**
 * The bottom bar (ticket 302) — the three places that are not a trip.
 *
 * WORDS, NOT ICONS. #299 removed the trip's own tab bar and said a word needs
 * no icon beside it; the same holds here. React Native has no SVG without
 * another dependency, and three nouns are clearer than three drawings anyone
 * would have to learn (#148 forbids the emoji that would otherwise fill in).
 *
 * A TRIP IS PUSHED OVER THIS, not inside it. `trip/[id]` lives one level up in
 * the `(app)` stack, so opening a trip covers the bar entirely and the section
 * sheet (#299) stays the only way around inside one. Two navigations stacked on
 * top of each other is the thing that direction exists to avoid.
 */
import { Tabs } from "expo-router";

import { useTheme } from "@/components/theme";
import { fonts, size } from "@/lib/theme";

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.sheet },
        headerTintColor: c.ink,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: c.paper },
        tabBarStyle: { backgroundColor: c.sheet, borderTopColor: c.rule },
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c["ink-3"],
        tabBarLabelStyle: { fontFamily: fonts.type, fontSize: size.label },
        // The label is the whole control, so it sits where an icon would.
        tabBarIconStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="trips" options={{ title: "Trips" }} />
      <Tabs.Screen name="profile" options={{ title: "You" }} />
    </Tabs>
  );
}
