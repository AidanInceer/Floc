import { monthOf, thisMonth, type IsoMonth } from "@floc/core/dates/availability";
import { useState } from "react";
import { View } from "react-native";

import { MonthGrid, type CellLook } from "./month-grid";
import { MonthNav } from "./month-nav";
import { nextRange, rangeLook, type DateRange } from "@/lib/dates/range";
import { space } from "@/lib/theme";

const TRIP_DAY: CellLook = { ground: "pastel-blue", ink: "pastel-blue-ink", count: null, ringed: true };
const LOOKS: Record<ReturnType<typeof rangeLook>, CellLook> = {
  end: TRIP_DAY,
  inside: TRIP_DAY,
  outside: { ground: null, ink: null, count: null, ringed: false },
};

/** Tap a day, then another, or drag across days. Drawn as Dates draws a trip's own days. */
export function RangePicker({ value, onChange }: { value: DateRange | null; onChange: (range: DateRange) => void }) {
  const [month, setMonth] = useState<IsoMonth>(value ? monthOf(value.start) : thisMonth());
  return (
    <View style={{ gap: space.sm }}>
      <MonthNav month={month} onChange={setMonth} />
      <MonthGrid
        month={month}
        look={(date) => LOOKS[rangeLook(value, date)]}
        onPaint={(anchor, target) => onChange(nextRange(value, anchor, target))}
        onRelease={() => {}}
      />
    </View>
  );
}
