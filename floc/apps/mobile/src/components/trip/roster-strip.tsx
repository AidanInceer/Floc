/**
 * Who is coming, at a glance (ticket 296).
 *
 * The roster screen is where you act on people — remove, promote, leave. This
 * is only the answer to "who is on this". So there is no control here beyond
 * the one that opens the full roster.
 *
 * A seat colour comes from `whoTone`, computed from the display name, and is
 * never a stored column. `Admin` is a word, so the admin powers are legible
 * without seeing a colour at all (rule 6, #204).
 */
import { whoTone } from "@floc/core/people/who";
import { View } from "react-native";

import { Seat } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Label, Pill } from "../system/ui";
import { radius, space } from "@/lib/theme";

export type RosterPerson = {
  userId: string;
  name: string;
  role: "admin" | "member";
};

export function RosterStrip({
  people,
  statuses,
}: {
  people: RosterPerson[];
  /** userId → what they still owe the group, in words (`groupStatuses`). */
  statuses: Map<string, string[]>;
}) {
  const { c } = useTheme();

  return (
    <View style={{ gap: space.xs }}>
      {people.map((person) => {
        const tone = whoTone(person.name);
        return (
          <View
            key={person.userId}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.sm,
              // The web draws each person on its own `bg-sheet-2` row, so the
              // list reads as people and not as loose text on the card.
              backgroundColor: c["sheet-2"],
              borderRadius: radius.md,
              paddingHorizontal: space.sm,
              paddingVertical: space.xs,
            }}
          >
            <Seat
              initial={person.name.slice(0, 1).toUpperCase()}
              ground={c[tone]}
              ink={c[`${tone}-ink`]}
            />
            {/* Who on the left, status on the right, same place every row. */}
            <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm }}>
              <Body>{person.name}</Body>
              {person.role === "admin" ? <Label>Admin</Label> : null}
            </View>
            {(statuses.get(person.userId) ?? []).length > 0 ? (
              <View style={{ alignItems: "flex-end", gap: space.xs }}>
                {(statuses.get(person.userId) ?? []).map((word) => (
                  <Pill key={word} word={word} tone="pastel-yellow" />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
