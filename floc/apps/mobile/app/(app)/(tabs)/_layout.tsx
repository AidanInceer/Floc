/**
 * The bottom bar (ticket 302) — the three places that are not a trip.
 *
 * MARKS AND WORDS, BOTH. #299 and #302 chose words alone because React Native
 * had no SVG here and three bad drawings read worse than three nouns. With
 * `react-native-svg` the drawings are the web app's own line-art (see
 * `tab-icons`), so each tab now carries its mark *and* its word: the glyph
 * makes the bar scannable, the word is what nobody has to learn.
 *
 * A TRIP IS PUSHED INSIDE THIS BAR, not over it. `trip/[id]` is a screen of
 * this tab layout with its own header hidden, so the bar stays reachable while
 * a trip is open — leaving a trip should not require finding the back arrow.
 * The trip's own sections carry their own navigation, one level below.
 *
 * THE MARKS ARE PEN, THE WORDS ARE INK. Every glyph is full `pen`, on or off
 * — a dimmed inactive mark was tried and read as three disabled buttons. Which
 * tab you are on is said by the word underneath going from `ink-3` to `ink`,
 * which is the signal that works without colour anyway (#204).
 */
import { Tabs } from "expo-router";

import { Bell } from "@/components/notifications/bell";
import { ExploreIcon, TripsIcon, YouIcon } from "@/components/system/tab-icons";
import { useTheme } from "@/components/system/theme";
import { fonts, size } from "@/lib/theme";

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerRight: () => <Bell />,
        headerStyle: { backgroundColor: c.sheet },
        headerTintColor: c.ink,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: c.paper },
        tabBarStyle: { backgroundColor: c.sheet, borderTopColor: c.rule },
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c["ink-3"],
        tabBarLabelStyle: { fontFamily: fonts.type, fontSize: size.label },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: () => <ExploreIcon color={c.pen} />,
          // Explore has its own stack now (list, then one listing), and that
          // stack draws the header — without this there are two.
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Trips",
          tabBarIcon: () => <TripsIcon color={c.pen} />,
        }}
      />
      {/* Settings and Saved lists are NOT hidden tabs. A hidden tab is still a
          tab, so back from one pops to whichever tab the bar starts on rather
          than to You — they are pushed onto the (app) stack instead, the way
          Friends is. */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "You",
          tabBarIcon: () => <YouIcon color={c.pen} />,
        }}
      />
      {/* A trip lives under the Trips tab so the bar survives opening one; it
          is not itself a tab. */}
      {/* The route is `trip/[id]`, not `trip` — naming the folder alone matches
          nothing, and the bar grows a fourth tab labelled with the raw path.
          `href: null` keeps it out of the bar; `headerShown` off stops a second
          header drawing over the trip's own. */}
      <Tabs.Screen name="trip/[id]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
