// Why: nights are picked on the month calendar, with where the group sleeps under each week (days-week F).
import { WEEKDAY_LABELS, formatMonth, monthGrid, monthOf } from "@floc/core/dates/availability";
import { formatDate, type IsoDate } from "@floc/core/dates/dates";
import { shortPlace } from "@floc/core/itinerary/names/place-name";
import { rangeMark, weekRuns, type WeekRun } from "@floc/core/itinerary/stay/stay-calendar";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

type Range = { start: IsoDate; end: IsoDate };

export function NightCalendar({
  nights,
  pick,
  placeOf,
  onTap,
}: {
  /** The trip's nights, in order: every day but the last. */
  nights: IsoDate[];
  pick: Range;
  /** Where the group sleeps on a night after the save; null is not set. */
  placeOf: (date: IsoDate) => string | null;
  onTap: (date: IsoDate) => void;
}) {
  const { c } = useTheme();
  const own = new Set(nights);
  const months = [...new Set(nights.map(monthOf))];
  const tripPlace = (date: IsoDate) => (own.has(date) ? placeOf(date) : undefined);
  const inPick = (date: IsoDate) => date >= pick.start && date <= pick.end;

  return (
    <View style={{ gap: space.md }}>
      {months.map((month) => (
        <View key={month}>
          <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small, marginBottom: space.xs }}>{formatMonth(month)}</Text>
          <View style={{ flexDirection: "row" }} importantForAccessibility="no-hide-descendants">
            {WEEKDAY_LABELS.map((w, i) => (
              <Text key={i} style={{ flex: 1, textAlign: "center", color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, paddingVertical: space.xs }}>
                {w}
              </Text>
            ))}
          </View>
          {monthGrid(month).map((week) => (
            <View key={week.find(Boolean)}>
              <View style={{ flexDirection: "row", marginTop: 2 }}>
                {week.map((date, i) => (date ? <NightCell key={date} date={date} own={own.has(date)} pick={pick} onTap={onTap} /> : <View key={i} style={{ flex: 1 }} />))}
              </View>
              {week.some((date) => date && own.has(date)) ? <WeekBars runs={weekRuns(week, tripPlace, inPick)} /> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function NightCell({ date, own, pick, onTap }: { date: IsoDate; own: boolean; pick: Range; onTap: (date: IsoDate) => void }) {
  const { c } = useTheme();
  const mark = own ? rangeMark(date, pick) : null;
  const number = (
    <Text style={{ color: mark ? c["pen-deep"] : c.ink, fontFamily: mark ? fonts.typeBold : fonts.type, fontSize: size.small }}>{Number(date.slice(8))}</Text>
  );
  if (!own) return <View style={{ flex: 1, height: 44, alignItems: "center", justifyContent: "center", opacity: 0.45 }}>{number}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formatDate(date)}
      accessibilityState={{ selected: !!mark }}
      onPress={() => onTap(date)}
      style={({ pressed }) => ({
        flex: 1,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: mark || pressed ? c["pen-2"] : "transparent",
        borderTopLeftRadius: !mark || mark.first ? radius.sm : 0,
        borderBottomLeftRadius: !mark || mark.first ? radius.sm : 0,
        borderTopRightRadius: !mark || mark.last ? radius.sm : 0,
        borderBottomRightRadius: !mark || mark.last ? radius.sm : 0,
      })}
    >
      {number}
    </Pressable>
  );
}

function WeekBars({ runs }: { runs: WeekRun[] }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", marginTop: 2, marginBottom: space.xs }} importantForAccessibility="no-hide-descendants">
      {runs.map((run, i) => {
        if (!("place" in run)) return <View key={i} style={{ flex: run.span }} />;
        const set = !!run.place;
        return (
          <View key={i} style={{ flex: run.span, minWidth: 0, paddingHorizontal: 1 }}>
            <View
              style={{
                height: 18,
                justifyContent: "center",
                paddingHorizontal: space.xs,
                borderRadius: radius.sm,
                backgroundColor: run.on ? c["pen-2"] : set ? c["sheet-3"] : c.highlight,
                borderWidth: run.on || set ? 0 : 1,
                borderStyle: "dashed",
                borderColor: c["highlight-edge"],
              }}
            >
              <Text numberOfLines={1} style={{ color: run.on ? c["pen-deep"] : set ? c["ink-2"] : c["highlight-ink"], fontFamily: run.on ? fonts.sansBold : fonts.sans, fontSize: 12 }}>
                {run.place ? shortPlace(run.place) : "Not set"}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
