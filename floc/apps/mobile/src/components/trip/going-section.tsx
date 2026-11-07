// Why one line: the web's "B One line" — faces, count and names; the line opens the roster, and Invite is the one verb (#312).
import { goingNames, goingNotes } from "@floc/core/trip/overview/going";
import { Pressable, Text, View } from "react-native";

import { FaceStack, type Face } from "../system/face-stack";
import { AddPersonGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { LineRow } from "./overview/line-row";
import { fonts, size, space } from "@/lib/theme";

export function GoingLine({
  people,
  statuses,
  onOpen,
  onInvite,
}: {
  people: Face[];
  /** userId → what they still owe the group, in words (`groupStatuses`). */
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
        <Text numberOfLines={2} style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>
          {goingNames(people.map((p) => p.name.split(" ")[0]))}
          {notes.length > 0 ? ` · ${notes.join(" · ")}` : ""}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Invite"
        hitSlop={{ top: 16, bottom: 16, left: 12, right: 0 }}
        onPress={onInvite}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.xs, opacity: pressed ? 0.6 : 1 })}
      >
        <AddPersonGlyph color={c.pen} />
        <Text style={{ color: c.pen, fontFamily: fonts.sansBold, fontSize: size.small }}>Invite</Text>
      </Pressable>
    </LineRow>
  );
}
