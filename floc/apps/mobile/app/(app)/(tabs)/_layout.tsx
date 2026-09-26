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
 * which is the signal that works without colour anyway (#204), and by the
 * small blue tile the current mark sits in — the web's top bar says it the same way.
 */
import { Tabs, usePathname } from "expo-router";

import { Bell } from "@/components/notifications/bell";
import { ExploreIcon, TripsIcon, YouIcon } from "@/components/system/tab-icons";
import { useTheme } from "@/components/system/theme";
import { TabTile } from "@/components/system/tab-tile";
import { fonts, size } from "@/lib/theme";

export default function TabsLayout() {
  const { c } = useTheme();
  // A trip is its own hidden screen, so the bar thinks no tab is focused; it is still one of your Trips.
  const inTrip = usePathname().startsWith("/trip/");
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
          tabBarIcon: ({ focused }) => <TabTile on={focused} mark={(color) => <ExploreIcon color={color} />} />,
          // Explore has its own stack now (list, then one listing), and that
          // stack draws the header — without this there are two.
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Trips",
          tabBarIcon: ({ focused }) => <TabTile on={focused || inTrip} mark={(color) => <TripsIcon color={color} />} />,
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
          tabBarIcon: ({ focused }) => <TabTile on={focused} mark={(color) => <YouIcon color={color} />} />,
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
