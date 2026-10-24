// #460, option C: how much is sorted, the next thing and its action; the rest folds out. Same list as the web.
import type { Gap } from "@floc/core/trip/overview/left-to-sort";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { Button, Card } from "../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

const SHOWN = 5;

export function LeftToSort({ open, sorted, onGo }: { open: Gap[]; sorted: number; onGo: (gap: Gap) => void }) {
  const { c } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const next = open[0];
  if (!next) return null;
  const total = sorted + open.length;
  const small = { color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small };

  return (
    <Card>
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <View
            accessibilityRole="image"
            accessibilityLabel={`${sorted} of ${total} sorted`}
            style={{ width: 64, height: 6, borderRadius: radius.pill, backgroundColor: c["sheet-2"], overflow: "hidden" }}
          >
            <View style={{ width: `${Math.round((sorted / total) * 100)}%`, height: "100%", backgroundColor: c["pastel-green-ink"] }} />
          </View>
          <Text style={small}>
            <Text style={{ color: c.ink, fontFamily: fonts.display, fontSize: size.body }}>{open.length}</Text> left to sort
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? "Hide the list" : "Show all"}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
            hitSlop={8}
            style={{ marginLeft: "auto" }}
          >
            <Text style={small}>{expanded ? "Hide" : "Show all"}</Text>
          </Pressable>
        </View>
        <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
          {next.mine ? "Next for you: " : "Next: "}
          <Text style={{ color: c.ink, fontFamily: fonts.sansBold }}>{next.text}</Text>
        </Text>
        <Button label={next.action} variant={next.mine ? "primary" : undefined} onPress={() => onGo(next)} />
        {expanded ? (
          <View style={{ borderTopWidth: 1, borderTopColor: c.rule, paddingTop: space.sm, gap: space.sm }}>
            {open.slice(0, SHOWN).map((gap) => (
              <Pressable key={gap.key} accessibilityRole="link" onPress={() => onGo(gap)} style={{ gap: 2 }}>
                <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>{gap.text}</Text>
                <Text style={small}>
                  {gap.sub ? `${gap.sub} · ` : ""}
                  {gap.action}
                </Text>
              </Pressable>
            ))}
            {open.length > SHOWN ? <Text style={small}>and {open.length - SHOWN} more</Text> : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}
