import { fitCount, openFirst } from "@floc/core/trip/nudge/fit-count";
import { nudgeLine, type NudgePerson, type NudgeTask } from "@floc/core/trip/nudge/nudge";
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Face } from "../../system/face";
import { MoreGlyph, TickGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { Button, ChoiceSheet, IconButton } from "../../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";
import { NudgedMark, NudgeNote } from "./nudge-word";
import { useNudge, type NudgePress } from "./use-nudge";

const GAP = 6;
const MENU = 34;
const HEIGHT = 34;

function Chip({ person, busy, onPress }: { person: NudgePerson; busy: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const done = person.nudged;
  return (
    <Pressable
      accessibilityRole={done ? "text" : "button"}
      accessibilityLabel={done ? `${person.name}: nudged today` : `Nudge ${person.name}`}
      disabled={done || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.xs,
        height: HEIGHT,
        paddingLeft: 6,
        paddingRight: space.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: done ? "transparent" : c["rule-2"],
        backgroundColor: done ? c["sheet-2"] : pressed ? c["pen-2"] : c.sheet,
        opacity: busy ? 0.5 : 1,
      })}
    >
      <Face name={person.name} look="presence" size={20} />
      <Text numberOfLines={1} style={{ color: done ? c["ink-3"] : c.ink, fontFamily: fonts.sans, fontSize: size.small }}>
        {person.name}
      </Text>
      {done ? <TickGlyph color={c["ink-3"]} /> : null}
    </Pressable>
  );
}

function AllButton({ people, nudge, wide }: { people: NudgePerson[]; nudge: NudgePress; wide?: boolean }) {
  const open = people.filter((p) => !p.nudged);
  if (open.length === 0) return <NudgedMark />;
  return (
    <Button
      label="Nudge all"
      variant="quiet"
      fit={wide ? "full" : "small"}
      busy={nudge.busy === "all"}
      disabled={nudge.busy !== null}
      onPress={() => nudge.press("all", open.map((p) => p.userId))}
    />
  );
}

export function NudgeAll({ tripId, task, people }: { tripId: number; task: NudgeTask; people: NudgePerson[] }) {
  const nudge = useNudge(tripId, task);
  return (
    <View style={{ gap: space.xs }}>
      <AllButton people={people} nudge={nudge} wide />
      <NudgeNote note={nudge.note} />
    </View>
  );
}

function Chips({ people, nudge }: { people: NudgePerson[]; nudge: NudgePress }) {
  const [room, setRoom] = useState(0);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [menu, setMenu] = useState(false);
  const ordered = openFirst(people);
  const measured = ordered.every((p) => widths[p.userId] !== undefined) && room > 0;
  const shown = measured ? fitCount(ordered.map((p) => widths[p.userId]), room, GAP, MENU) : ordered.length;
  const hidden = ordered.slice(shown).filter((p) => !p.nudged);

  return (
    <View onLayout={(e) => setRoom(e.nativeEvent.layout.width)}>
      <View style={{ position: "absolute", opacity: 0, flexDirection: "row", gap: GAP }} pointerEvents="none" importantForAccessibility="no-hide-descendants">
        {ordered.map((p) => (
          <View key={p.userId} onLayout={(e) => { const w = e.nativeEvent.layout.width; setWidths((m) => (m[p.userId] === w ? m : { ...m, [p.userId]: w })); }}>
            <Chip person={p} busy={false} onPress={() => undefined} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: GAP, opacity: measured ? 1 : 0 }}>
        {ordered.slice(0, shown).map((p) => (
          <Chip key={p.userId} person={p} busy={nudge.busy === p.userId || nudge.busy === "all"} onPress={() => nudge.press(p.userId, [p.userId])} />
        ))}
        {hidden.length > 0 ? (
          <IconButton label="Nudge someone else" onPress={() => setMenu(true)}>
            {(ink) => <MoreGlyph color={ink} />}
          </IconButton>
        ) : null}
      </View>
      <ChoiceSheet
        title="Nudge someone else"
        open={menu}
        onClose={() => setMenu(false)}
        value=""
        options={hidden.map((p) => ({ value: p.userId, label: `Nudge ${p.name}` }))}
        onChange={(userId) => nudge.press(userId, [userId])}
      />
    </View>
  );
}

export function NudgeLine({ tripId, task, people, lead }: { tripId: number; task: NudgeTask; people: NudgePerson[]; lead?: ReactNode }) {
  const { c } = useTheme();
  const nudge = useNudge(tripId, task);
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        {lead}
        <Text style={{ flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>{nudgeLine(task, people.length)}</Text>
        <AllButton people={people} nudge={nudge} />
      </View>
      <Chips people={people} nudge={nudge} />
      <View style={{ alignItems: "flex-end" }}>
        <NudgeNote note={nudge.note} />
      </View>
    </View>
  );
}
