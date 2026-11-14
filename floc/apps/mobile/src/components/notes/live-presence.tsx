import type { PresentPerson } from "@floc/core/notes/live/live-presence";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/system/theme";
import { fonts, radius, size } from "@/lib/theme";
import { Face } from "@/components/system/face";
import { faceOverlap } from "@floc/core/people/faces/face-overlap";

export function PresenceRow({ people }: { people: PresentPerson[] }) {
  const { c } = useTheme();
  const shown = people.slice(0, 5);
  const extra = people.length - shown.length;
  const overlap = faceOverlap(22);
  return (
    <View
      accessibilityLabel={`${people.length} ${people.length === 1 ? "person" : "people"} here`}
      style={{ flexDirection: "row", alignItems: "center" }}
    >
      {shown.map((person, index) => (
        <View key={person.id} accessibilityLabel={person.name} style={{ marginLeft: index === 0 ? 0 : overlap }}>
          <Face name={person.name} tone={person.tone} look="presence" />
        </View>
      ))}
      {extra > 0 ? (
        <View
          accessibilityLabel={`${extra} more people`}
          style={{
            minWidth: 22,
            height: 22,
            marginLeft: overlap,
            paddingHorizontal: 4,
            borderRadius: radius.sm,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: c.rule,
            backgroundColor: c["sheet-2"],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}
