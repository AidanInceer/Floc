import { spanLabel } from "@floc/core/dates/dates-tabs";
import { View } from "react-native";

import { ChevronGlyph } from "../system/glyphs";
import { Body, Button, IconButton, Label } from "../system/ui";
import type { BestWindow } from "@/lib/dates/best-windows";
import { space } from "@/lib/theme";

function Pager({ at, of, onStep }: { at: number; of: number; onStep: (delta: number) => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
      <IconButton label="Previous option" onPress={() => onStep(-1)}>
        {(ink) => (
          <View style={{ transform: [{ rotate: "90deg" }] }}>
            <ChevronGlyph color={ink} />
          </View>
        )}
      </IconButton>
      <Label>{`${at + 1} of ${of}`}</Label>
      <IconButton label="Next option" onPress={() => onStep(1)}>
        {(ink) => (
          <View style={{ transform: [{ rotate: "-90deg" }] }}>
            <ChevronGlyph color={ink} />
          </View>
        )}
      </IconButton>
    </View>
  );
}

export function BestDatesCard({
  windows,
  at,
  onStep,
  current,
  onSet,
}: {
  windows: BestWindow[];
  at: number;
  onStep: (delta: number) => void;
  current: boolean;
  onSet: () => void;
}) {
  const w = windows[at];
  if (!w)
    return (
      <View style={{ padding: space.lg, gap: space.xs }}>
        <Body bold>Best dates</Body>
        <Body tone="ink-2">No days marked yet</Body>
      </View>
    );
  return (
    <View style={{ padding: space.lg, gap: space.xs }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 36 }}>
        <Body bold>Best dates</Body>
        {windows.length > 1 ? <Pager at={at} of={windows.length} onStep={onStep} /> : null}
      </View>
      <Body>{spanLabel(w.start, w.end)}</Body>
      <Body tone="ink-2">{w.headline}</Body>
      {w.reasons.map((reason) => (
        <Body key={reason} tone="ink-2">
          {reason}
        </Body>
      ))}
      <View style={{ marginTop: space.sm, alignItems: "flex-start" }}>
        {current ? <Label>Set</Label> : <Button label="Set the dates" fit="small" onPress={onSet} />}
      </View>
    </View>
  );
}
