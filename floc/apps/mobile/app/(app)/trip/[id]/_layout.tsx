/**
 * One trip, five tabs (tickets 291, 297).
 *
 * The web app draws these as a pill row under the trip name; a phone gets the
 * platform's own bottom bar. Same places, same order, different chrome —
 * which is the whole point of keeping the two UIs separate.
 *
 * NO TAB IS GATED. A trip has no lifecycle state (rule 4), so Money is
 * reachable on a trip with no expenses and Itinerary on one with no dates.
 * Each tab says what is missing rather than refusing to open.
 */
import { Tabs } from "expo-router";

import { useTheme } from "@/components/theme";
import { TabGlyph } from "@/components/glyphs";

export default function TripLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.sheet },
        headerTintColor: c.ink,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: c.sheet, borderTopColor: c.rule },
        tabBarActiveTintColor: c.pen,
        tabBarInactiveTintColor: c["ink-3"],
        sceneStyle: { backgroundColor: c.paper },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color }) => <TabGlyph name="overview" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dates"
        options={{
          title: "Dates",
          tabBarIcon: ({ color }) => <TabGlyph name="dates" color={color} />,
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          title: "Itinerary",
          tabBarIcon: ({ color }) => <TabGlyph name="itinerary" color={color} />,
        }}
      />
      <Tabs.Screen
        name="money"
        options={{
          title: "Money",
          tabBarIcon: ({ color }) => <TabGlyph name="money" color={color} />,
        }}
      />
      <Tabs.Screen
        name="roster"
        options={{
          title: "Who",
          tabBarIcon: ({ color }) => <TabGlyph name="roster" color={color} />,
        }}
      />
    </Tabs>
  );
}
