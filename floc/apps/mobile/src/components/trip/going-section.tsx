// Why one door: "Share trip" and "Invite friends" were the same job twice; the invite screen holds the friends and the link, as the web's Invite does (#312).
import { Text, View } from "react-native";

import { AddPersonGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Button, Card, SectionTitle } from "../system/ui";
import { RosterStrip, type RosterPerson } from "./roster-strip";
import { fonts, size, space } from "@/lib/theme";

export function GoingSection({
  people,
  statuses,
  onInvite,
}: {
  people: RosterPerson[];
  statuses: Map<string, string[]>;
  onInvite: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
          <SectionTitle>Who&apos;s going</SectionTitle>
          <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{people.length}</Text>
        </View>
        <Button label="Invite" variant="quiet" fit="small" icon={(ink) => <AddPersonGlyph color={ink} />} onPress={onInvite} />
      </View>
      <Card style={{ paddingVertical: space.xs }}>
        <RosterStrip people={people} statuses={statuses} />
      </Card>
    </View>
  );
}
