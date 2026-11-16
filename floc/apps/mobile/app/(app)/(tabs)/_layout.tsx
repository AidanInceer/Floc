import { Tabs, usePathname } from "expo-router";
import { StyleSheet } from "react-native";

import { Bell } from "@/components/notifications/bell";
import { ExploreIcon, TripsIcon, YouIcon } from "@/components/system/tab-icons";
import { useTheme } from "@/components/system/theme";
import { TabLabel, TabMark } from "@/components/system/tab-mark";
import { fonts, size } from "@/lib/theme";

export default function TabsLayout() {
  const { c } = useTheme();
  const inTrip = usePathname().startsWith("/trip/");
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerRight: () => <Bell />,
        headerStyle: { backgroundColor: c.sheet },
        headerTintColor: c.ink,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: size.heading },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: c.paper },
        tabBarStyle: { backgroundColor: c.sheet, borderTopColor: c.rule, borderTopWidth: StyleSheet.hairlineWidth, elevation: 0 },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => <TabMark on={focused} mark={(color) => <ExploreIcon color={color} />} />,
          tabBarLabel: ({ focused }) => <TabLabel on={focused}>Explore</TabLabel>,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Trips",
          tabBarIcon: ({ focused }) => <TabMark on={focused || inTrip} mark={(color) => <TripsIcon color={color} />} />,
          tabBarLabel: ({ focused }) => <TabLabel on={focused || inTrip}>Trips</TabLabel>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "You",
          tabBarIcon: ({ focused }) => <TabMark on={focused} mark={(color) => <YouIcon color={color} />} />,
          tabBarLabel: ({ focused }) => <TabLabel on={focused}>You</TabLabel>,
        }}
      />
      <Tabs.Screen name="trip/[id]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
