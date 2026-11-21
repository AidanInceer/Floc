import { cubeColumns, type Gap, type GapKind, type ToDoList, type Sorted } from "@floc/core/trip/overview/to-do";
import { SORT_COLOURS } from "@floc/core/design/section-colours";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BedGlyph, ChevronGlyph, StarGlyph, TickGlyph } from "../system/glyphs";
import { SectionGlyph } from "./section-glyph";
import { useTheme } from "../system/theme";
import { Button, Card } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";
import { NudgeAll, NudgeLine } from "./nudge/nudge-chips";

const CUBE = 11;
const GAP = 3;
const CARD = 56;

function SortMark({ kind, done }: { kind: GapKind; done: boolean }) {
  const { c } = useTheme();
  const colour = SORT_COLOURS[kind];
  const ink = c[`pastel-${colour}-ink`];
  const marks = {
    days: <SectionGlyph route="dates" color={ink} />,
    ideas: <StarGlyph color={ink} on={false} />,
    money: <SectionGlyph route="money" color={ink} />,
    packing: <SectionGlyph route="packing" color={ink} />,
    plan: <SectionGlyph route="days" color={ink} />,
    stay: <BedGlyph color={ink} />,
    travel: <SectionGlyph route="days" color={ink} />,
  };
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: c[`pastel-${colour}`] }}>
      {done ? <TickGlyph color={ink} /> : marks[kind]}
    </View>
  );
}

function Cubes({ total, filled }: { total: number; filled: number }) {
  const { c } = useTheme();
  const cols = cubeColumns(total);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width: cols * CUBE + (cols - 1) * GAP, flexDirection: "row", flexWrap: "wrap", gap: GAP }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: CUBE,
            height: CUBE,
            borderRadius: 3,
            borderWidth: 1,
            backgroundColor: i < filled ? c["pastel-blue-edge"] : c["sheet-2"],
            borderColor: i < filled ? c["pen-edge"] : c["rule-2"],
          }}
        />
      ))}
    </View>
  );
}

function StackCard({ item, onPress }: { item: Gap | Sorted; onPress?: () => void }) {
  const { c } = useTheme();
  const done = !("action" in item);
  return (
    <Pressable
      accessibilityRole={done ? undefined : "link"}
      onPress={onPress}
      disabled={done}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        minHeight: CARD,
        backgroundColor: c.sheet,
        borderColor: c.rule,
        borderWidth: 1,
        borderRadius: radius.sm,
        paddingHorizontal: space.md,
        paddingVertical: space.sm,
      }}
    >
      <SortMark kind={item.kind} done={done} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: done ? c["ink-3"] : c.ink, fontFamily: fonts.sans, fontSize: size.small }}>
          {item.text}
        </Text>
        {item.sub ? (
          <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>
            {item.sub.join(" · ")}
          </Text>
        ) : null}
      </View>
      {"action" in item ? (
        <Button label={item.action} variant="quiet" fit="small" onPress={() => onPress?.()} />
      ) : (
        <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>Done</Text>
      )}
    </Pressable>
  );
}

function NudgeCard({ tripId, gap }: { tripId: number; gap: Gap & { nudge: NonNullable<Gap["nudge"]> } }) {
  const { c } = useTheme();
  return (
    <View style={{ minHeight: CARD, backgroundColor: c.sheet, borderColor: c.rule, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.sm }}>
      <NudgeLine tripId={tripId} task={gap.nudge.task} people={gap.nudge.people} lead={<SortMark kind={gap.kind} done={false} />} />
    </View>
  );
}

export function ToDoBanner({ tripId, list, onGo }: { tripId: number; list: ToDoList; onGo: (gap: Gap) => void }) {
  const { c } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const next = list.open[0];
  if (!next) return null;
  const sorted = list.done.length;
  const total = sorted + list.left;
  const small = { color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small };

  return (
    <View style={{ gap: space.xs }}>
      <Card>
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Cubes total={total} filled={sorted} />
            <Text style={small}>
              <Text style={{ color: c.ink, fontFamily: fonts.display, fontSize: size.body }}>{sorted}</Text> of {total} done
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={expanded ? "Hide what is left" : "Show what is left"}
              accessibilityState={{ expanded }}
              onPress={() => setExpanded(!expanded)}
              hitSlop={14}
              style={{ marginLeft: "auto", padding: space.xs }}
            >
              <ChevronGlyph color={c["ink-2"]} open={expanded} />
            </Pressable>
          </View>
          <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
            {next.mine ? "Next for you: " : "Next: "}
            <Text style={{ color: c.ink, fontFamily: fonts.sansBold }}>{next.text}</Text>
          </Text>
          {next.nudge ? (
            <NudgeAll tripId={tripId} task={next.nudge.task} people={next.nudge.people} />
          ) : (
            <Button label={next.action} variant={next.mine ? "primary" : undefined} onPress={() => onGo(next)} />
          )}
        </View>
      </Card>
      {expanded
        ? list.open.map((gap) =>
            gap.nudge ? (
              <NudgeCard key={gap.key} tripId={tripId} gap={{ ...gap, nudge: gap.nudge }} />
            ) : (
              <StackCard key={gap.key} item={gap} onPress={() => onGo(gap)} />
            ),
          )
        : null}
      {expanded && sorted > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${sorted} done`}
          accessibilityState={{ expanded: showDone }}
          onPress={() => setShowDone(!showDone)}
          style={{ flexDirection: "row", alignItems: "center", gap: space.md, minHeight: CARD, backgroundColor: c["pen-2"], borderColor: c["pen-edge"], borderWidth: 1, borderStyle: "dashed", borderRadius: radius.sm, padding: space.md }}
        >
          <Cubes total={sorted} filled={sorted} />
          <Text style={small}>{sorted} done</Text>
          <View style={{ marginLeft: "auto" }}>
            <ChevronGlyph color={c["ink-2"]} open={showDone} />
          </View>
        </Pressable>
      ) : null}
      {expanded && showDone ? list.done.map((item) => <StackCard key={item.key} item={item} />) : null}
    </View>
  );
}
