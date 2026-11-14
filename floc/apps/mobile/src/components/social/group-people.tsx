import { firstName, peopleCount } from "@floc/core/people/group-ticks";
import { Pressable, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import type { FriendPerson } from "@floc/api/port";

import { MinusGlyph, TickGlyph } from "@/components/system/glyphs";
import { useTheme } from "@/components/system/theme";
import { Body, Empty, Figure } from "@/components/system/ui";
import { Face } from "@/components/system/face";
import { radius, space } from "@/lib/theme";

export function GroupChoice({ name, note, checked, onPress, disabled, face }: {
  name: string;
  note?: ReactNode;
  checked: boolean | "mixed";
  onPress: () => void;
  disabled?: boolean;
  face?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={name}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: 48,
        paddingHorizontal: space.sm, paddingVertical: space.sm, borderRadius: radius.sm,
        backgroundColor: checked || pressed ? c["pen-2"] : c.sheet,
        opacity: disabled ? 0.55 : 1,
      })}
    >
      {face ? <Face name={name} size={28} /> : null}
      <View style={{ flex: 1, gap: space.xs }}>
        <Body bold>{name}</Body>
        {note}
      </View>
      <View style={{
        width: 20, height: 20, borderRadius: radius.sm,
        borderWidth: StyleSheet.hairlineWidth, borderColor: checked ? c.pen : c["rule-2"],
        alignItems: "center", justifyContent: "center",
      }}>
        {checked === "mixed" ? <MinusGlyph color={c["pen-deep"]} /> : checked ? <TickGlyph color={c["pen-deep"]} /> : null}
      </View>
    </Pressable>
  );
}

export function GroupPeople({ people, ticked, onToggle, friendIds, cap }: {
  people: FriendPerson[];
  ticked: ReadonlySet<string>;
  onToggle: (id: string) => void;
  friendIds: ReadonlySet<string>;
  cap: number;
}) {
  if (people.length === 0) return <Empty>No friends yet.</Empty>;
  return (
    <View style={{ gap: space.xs }}>
      {people.map((person) => (
        <GroupChoice
          key={person.id}
          name={person.name}
          face
          checked={ticked.has(person.id)}
          disabled={!ticked.has(person.id) && ticked.size >= cap}
          note={friendIds.has(person.id) ? null : <Body tone="ink-2">Not a friend</Body>}
          onPress={() => onToggle(person.id)}
        />
      ))}
    </View>
  );
}

export function GroupFaces({ people, names = false, count = false }: {
  people: FriendPerson[];
  names?: boolean;
  count?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: space.xs }}>
      {(names ? people : people.slice(0, 4)).map((person) => (
        <View key={person.id} style={{ alignItems: "center", gap: space.xs, maxWidth: 80 }}>
          <Face name={person.name} size={24} />
          {names ? <Body tone="ink-2">{firstName(person.name)}</Body> : null}
        </View>
      ))}
      {count ? <Figure tone="ink-2">{peopleCount(people.length)}</Figure> : null}
    </View>
  );
}
