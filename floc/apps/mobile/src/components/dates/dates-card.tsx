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
  onRelease,
  open,
}: {
  month: IsoMonth;
  onMonth: (month: IsoMonth) => void;
  look: (date: string) => DayLook;
  onPaint: (anchor: string, target: string) => void;
  onRelease: () => void;
  open: { stubs: ReactNode; head: ReactNode; lead: ReactNode; bar: ReactNode; panel: ReactNode } | null;
}) {
  return (
    <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
      {open?.stubs}
      <View style={{ paddingHorizontal: space.md, paddingTop: space.md, gap: space.md }}>
        {open?.head}
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          {open?.lead}
          <View style={{ flex: 1 }}>
            <MonthNav month={month} onChange={onMonth} />
          </View>
        </View>
        <View pointerEvents={open ? "auto" : "none"} style={{ marginTop: space.sm }}>
          <MonthGrid month={month} look={look} onPaint={onPaint} onRelease={onRelease} />
        </View>
        <DatesKey />
        {open?.bar}
      </View>
      {open?.panel}
    </Card>
  );
}
