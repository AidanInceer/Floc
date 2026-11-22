import type { PaintMode } from "@floc/core/dates/finding/day-paint";
import { MARK_WORDS } from "@floc/core/dates/words";
import { View } from "react-native";

import { Segmented } from "../system/ui";

const MODES: readonly { value: PaintMode; label: string }[] = [
  { value: "free", label: MARK_WORDS.free },
  { value: "prefer", label: MARK_WORDS.prefer },
];

export function MarkSwitch({ mode, onMode }: { mode: PaintMode; onMode: (mode: PaintMode) => void }) {
  return (
    <View style={{ width: 160 }}>
      <Segmented options={MODES} value={mode} onChange={onMode} />
    </View>
  );
}
