import { monthOf, thisMonth, type IsoMonth } from "@floc/core/dates/availability";
import { useState } from "react";
import { View } from "react-native";

import { MonthGrid, type DayLook } from "./month-grid";
import { MonthNav } from "./month-nav";
import { nextRange, rangeLook, type DateRange } from "@/lib/dates/range";
import { space } from "@/lib/theme";

/** Drawn as Dates draws a trip's own days: one green run. */
function lookOf(range: DateRange | null, date: string): DayLook {
  const inside = rangeLook(range, date) !== "outside";
  return { mark: inside ? { kind: "trip" } : { kind: "none" }, mine: false, today: false, past: false, label: inside ? `${date}, picked` : date };
}

/** Tap a day, then another, or drag across days. */
export function RangePicker({ value, onChange }: { value: DateRange | null; onChange: (range: DateRange) => void }) {
  const [month, setMonth] = useState<IsoMonth>(value ? monthOf(value.start) : thisMonth());
  return (
    <View style={{ gap: space.sm }}>
      <MonthNav month={month} onChange={setMonth} />
      <MonthGrid
        month={month}
        look={(date) => lookOf(value, date)}
        onPaint={(anchor, target) => onChange(nextRange(value, anchor, target))}
        onRelease={() => {}}
      />
    </View>
  );
}
