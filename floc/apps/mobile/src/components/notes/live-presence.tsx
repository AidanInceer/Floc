import type { PresentPerson } from "@floc/core/notes/live/live-presence";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/system/theme";
import { fonts, radius } from "@/lib/theme";
import { initials } from "@floc/core/people/initials";

export function PresenceRow({ people }: { people: PresentPerson[] }) {
  const { c } = useTheme();
  const shown = people.slice(0, 5);
  const extra = people.length - shown.length;
  return (
    <View
      accessibilityLabel={`${people.length} ${people.length === 1 ? "person" : "people"} here`}
      style={{ flexDirection: "row", alignItems: "center" }}
    >
      {shown.map((person, index) => (
        <View
          key={person.id}
          accessibilityLabel={person.name}
          style={{
            width: 22,
            height: 22,
            marginLeft: index === 0 ? 0 : -6,
            borderRadius: radius.pill,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: c[`${person.tone}-ink`],
            backgroundColor: c[person.tone],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: c[`${person.tone}-ink`], fontFamily: fonts.sansBold, fontSize: 9 }}>
            {initials(person.name)}
          </Text>
        </View>
      ))}
      {extra > 0 ? (
        <View
          accessibilityLabel={`${extra} more people`}
          style={{
            minWidth: 22,
            height: 22,
            marginLeft: -6,
            paddingHorizontal: 4,
            borderRadius: radius.pill,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: c.rule,
            backgroundColor: c["sheet-2"],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: 9 }}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}
