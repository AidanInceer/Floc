import { goingNames, goingNotes } from "@floc/core/trip/overview/going";
import { Text, View } from "react-native";

import { FaceStack, type Face } from "../system/face-stack";
import { AddPersonGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Button } from "../system/ui";
import { LineRow } from "./overview/line-row";
import { fonts, size } from "@/lib/theme";

export function GoingLine({
  people,
  statuses,
  onOpen,
  onInvite,
}: {
  people: Face[];
  statuses: Map<string, string[]>;
  onOpen: () => void;
  onInvite: () => void;
}) {
  const { c } = useTheme();
  const notes = goingNotes({ toAddDates: people.filter((p) => (statuses.get(p.userId) ?? []).length > 0).length, invited: 0 });
  return (
    <LineRow label={`${people.length} going. Open the group`} onPress={onOpen}>
      <FaceStack faces={people} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{`${people.length} going`}</Text>
        <Text numberOfLines={3} style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>
          {goingNames(people.map((p) => p.name.split(" ")[0]))}
          {notes.length > 0 ? ` · ${notes.join(" · ")}` : ""}
        </Text>
      </View>
      <View>
        <Button label="Invite" fit="small" onPress={onInvite} icon={(ink) => <AddPersonGlyph color={ink} />} />
      </View>
    </LineRow>
  );
}
