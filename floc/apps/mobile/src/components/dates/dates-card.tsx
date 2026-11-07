// Why one card: the web's Dates card — stubs, one month, the bar for what is unsaved, then the open view's panel.
import type { IsoMonth } from "@floc/core/dates/availability";
import type { ReactNode } from "react";
import { View } from "react-native";

import { DatesKey } from "./dates-key";
import { MonthGrid } from "../days/month-grid";
import { MonthNav } from "../days/month-nav";
import { Card } from "../system/ui";
import type { DayLook } from "@/lib/dates/day-look";
import { space } from "@/lib/theme";

export function DatesCard({
  month,
  onMonth,
  look,
  onPaint,
  open,
}: {
  month: IsoMonth;
  onMonth: (month: IsoMonth) => void;
  look: (date: string) => DayLook;
  onPaint: (anchor: string, target: string) => void;
  /** The board's own parts; null while the dates are folded away and the month only reads. */
  open: { stubs: ReactNode; bar: ReactNode; panel: ReactNode } | null;
}) {
  return (
    <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
      {open?.stubs}
      <View style={{ paddingHorizontal: space.md, paddingTop: space.md }}>
        <MonthNav month={month} onChange={onMonth} />
        {/* Why: the grid claims every touch to paint; folded, it must let the page scroll. */}
        <View pointerEvents={open ? "auto" : "none"} style={{ marginTop: space.sm }}>
          <MonthGrid month={month} look={look} onPaint={onPaint} onRelease={() => {}} />
        </View>
        <DatesKey />
        {open?.bar}
      </View>
      {open?.panel}
    </Card>
  );
}
