/**
 * Who is coming, at a glance (ticket 296).
 *
 * The roster screen is where you act on people — remove, promote, leave. This
 * is only the answer to "who is on this". So there is no control here beyond
 * the one that opens the full roster.
 *
 * A seat colour comes from `whoTone`, computed from the display name, and is
 * never a stored column. `Admin` is a word, so the four powers are legible
 * without seeing a colour at all (rule 6, #204).
 */
import { whoTone } from "@floc/core/who";
import { View } from "react-native";

import { Seat } from "./glyphs";
import { useTheme } from "./theme";
import { Body, Pill } from "./ui";
import { space } from "@/lib/theme";

export type RosterPerson = {
  userId: string;
  name: string;
  role: "admin" | "member";
};

export function RosterStrip({ people }: { people: RosterPerson[] }) {
  const { c } = useTheme();

  return (
    <View style={{ gap: space.md }}>
      {people.map((person) => {
        const tone = whoTone(person.name);
        return (
          <View
            key={person.userId}
            style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
          >
            <Seat
              initial={person.name.slice(0, 1).toUpperCase()}
              ground={c[tone]}
              ink={c[`${tone}-ink`]}
            />
            <View style={{ flex: 1 }}>
              <Body>{person.name}</Body>
            </View>
            {person.role === "admin" ? <Pill word="Admin" tone="peri" /> : null}
          </View>
        );
      })}
    </View>
  );
}
