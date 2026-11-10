import { monthOf, type IsoMonth } from "@floc/core/dates/availability";
import { addDays, formatDate, formatDateRange, today, type IsoDate } from "@floc/core/dates/dates";
import type { StartMonth } from "@floc/core/trip/explore/copy/start-months";
import { MONTH_SHORT } from "@floc/core/trip/explore/finder/finder-words";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MonthGrid, type DayLook } from "../../days/month-grid";
import { MonthNav } from "../../days/month-nav";
import { useTheme } from "../../system/theme";
import { Label } from "../../system/ui";
import { fonts, radius, size, space } from "@/lib/theme";

function MonthChip({ month, on, onPress }: { month: StartMonth; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const name = MONTH_SHORT[month.month - 1];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${name} ${month.year}`}
      onPress={onPress}
      style={{
        minWidth: 52,
        alignItems: "center",
        paddingVertical: space.xs + 2,
        paddingHorizontal: space.sm,
        borderRadius: radius.sm,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: on ? c.pen : c["rule-2"],
        backgroundColor: on ? c["pen-2"] : c.sheet,
      }}
    >
      <Text style={{ color: on ? c["pen-deep"] : c["ink-2"], fontFamily: fonts.sansBold, fontSize: size.small }}>{name}</Text>
      <Text style={{ color: on ? c["pen-deep"] : c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>{month.year}</Text>
    </Pressable>
  );
}

/** Step two (ADR-025), as on the web: a best month starts on its 1st; Dates' own calendar takes any day still ahead. */
export function WhenStep({ months, nights, start, month, onStart, onMonth }: {
  months: StartMonth[];
  nights: number;
  start: IsoDate | null;
  month: IsoMonth;
  onStart: (date: IsoDate) => void;
  onMonth: (month: IsoMonth) => void;
}) {
  const { c } = useTheme();
  const now = today();
  const end = start ? addDays(start, nights) : null;
  const look = (date: string): DayLook => {
    const inStay = start !== null && end !== null && date >= start && date <= end;
    return { mark: inStay ? { kind: "trip" } : { kind: "none" }, mine: false, today: date === now, past: date <= now, label: inStay ? `${formatDate(date)}, on the trip` : formatDate(date) };
  };
  const pick = (date: string) => {
    if (date > now) onStart(date);
  };
  return (
    <View style={{ gap: space.md }}>
      <Text accessibilityRole="header" style={{ textAlign: "center", color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
        When do you start?
      </Text>
      {months.length ? (
        <View style={{ alignItems: "center", gap: space.sm }}>
          <Label>Best months</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: space.sm }}>
            {months.map((m) => (
              <MonthChip key={m.startDate} month={m} on={start === m.startDate} onPress={() => { onStart(m.startDate); onMonth(monthOf(m.startDate)); }} />
            ))}
          </View>
        </View>
      ) : null}
      <MonthNav month={month} onChange={onMonth} min={monthOf(now)} />
      <MonthGrid month={month} look={look} onPaint={(_, target) => pick(target)} onRelease={() => {}} />
      <Text style={{ minHeight: 20, textAlign: "center", color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small }}>
        {start && end ? `${formatDateRange(start, end)} · ${nights} nights` : ""}
      </Text>
    </View>
  );
}
