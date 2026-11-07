// Why a grey band of blocks under the month: the web's right-hand panel, laid under the calendar on a narrow screen.
import { tripCoverage } from "@floc/core/dates/availability";
import { formatDate, nightsBetween, type IsoDate } from "@floc/core/dates/dates";
import { spanLabel } from "@floc/core/dates/dates-tabs";
import { whoTone } from "@floc/core/people/who";
import type { TripForecastView } from "@floc/api/port";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Seat } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { DatesWeather } from "../days/dates-weather";
import type { ForecastDay } from "../days/weather-panel";
import { Button, Label } from "../system/ui";
import type { DatesView } from "@/lib/dates/day-look";
import { fonts, size, space } from "@/lib/theme";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function PanelBand({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return <View style={{ backgroundColor: c["sheet-2"], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>{children}</View>;
}

function Block({ name, value, note, action, first }: { name: string; value: string; note?: string; action?: ReactNode; first?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Label>{name}</Label>
        <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.body, fontVariant: ["tabular-nums"], marginTop: 2 }}>{value}</Text>
        {note ? <Text style={{ color: c["ink-2"], fontFamily: fonts.sans, fontSize: size.small }}>{note}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Coverage({ isFree, start, end }: { isFree: (d: IsoDate) => boolean; start: IsoDate | null; end: IsoDate | null }) {
  const cover = tripCoverage(isFree, start, end);
  if (!cover) return null;
  const note = cover.missing.length
    ? `You can't do ${cover.missing.map((d) => formatDate(d, { weekday: false })).join(", ")}`
    : "You can do every day of it";
  return <Block first name="In the trip" value={`${cover.free} of ${plural(cover.total, "day")}`} note={note} />;
}

export function BestFit({
  best,
  memberCount,
  first,
  onUse,
}: {
  best: { start: IsoDate; end: IsoDate; free: number } | null;
  memberCount: number;
  first?: boolean;
  onUse: () => void;
}) {
  if (!best) return null;
  const days = nightsBetween(best.start, best.end) + 1;
  return (
    <Block
      first={first}
      name="Best fit"
      value={spanLabel(best.start, best.end)}
      note={`${plural(days, "day")} · ${best.free} of ${memberCount} free`}
      action={<Button label="Use these" fit="small" variant="quiet" onPress={onUse} />}
    />
  );
}

export function TripBlock({ start, end, onClear }: { start: IsoDate | null; end: IsoDate | null; onClear: () => void }) {
  if (!start || !end) return <Block first name="The trip" value="No dates yet" note="Press the first day, then the last" />;
  return (
    <Block
      first
      name="The trip"
      value={spanLabel(start, end)}
      note={plural(nightsBetween(start, end), "night")}
      action={<Button label="Clear" variant="quiet" fit="small" onPress={onClear} />}
    />
  );
}

export function WhoAnswered({ people }: { people: { id: string; name: string; days: number; guest: boolean }[] }) {
  const { c } = useTheme();
  const answered = people.filter((p) => p.days > 0).length;
  return (
    <View style={{ padding: space.lg, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Label>Who has answered</Label>
        <Label>{`${answered} of ${people.length}`}</Label>
      </View>
      {people.map((p) => {
        const tone = whoTone(p.name);
        return (
          <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 32 }}>
            <Seat initial={p.name.slice(0, 1).toUpperCase()} ground={c[tone]} ink={c[`${tone}-ink`]} />
            <Text numberOfLines={1} style={{ flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>
              {p.guest ? `${p.name} · guest` : p.name}
            </Text>
            <Text style={{ color: p.days > 0 ? c["ink-3"] : c["highlight-ink"], fontFamily: fonts.type, fontSize: size.label + 1, fontVariant: ["tabular-nums"] }}>
              {p.days > 0 ? plural(p.days, "day") : "Waiting"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

type Person = { id: string; name: string; days: number; guest: boolean };

/** What sits under the month for the open view, as the web's right-hand panel. */
export function DatesPanel(p: {
  view: DatesView;
  trip: { start: IsoDate | null; end: IsoDate | null };
  isFree: (d: IsoDate) => boolean;
  best: { start: IsoDate; end: IsoDate; free: number } | null;
  people: Person[];
  weather: { view: TripForecastView | undefined; byDate: Record<string, ForecastDay>; openDay: string | null };
  onUseBest: () => void;
  onClear: () => void;
  onSeePro: () => void;
}) {
  const dated = !!p.trip.start && !!p.trip.end;
  const best = (first: boolean) => <BestFit best={p.best} memberCount={p.people.length} first={first} onUse={p.onUseBest} />;
  const body = {
    mine: (
      <>
        <Coverage isFree={p.isFree} start={p.trip.start} end={p.trip.end} />
        {best(!dated)}
      </>
    ),
    group: (
      <>
        {best(true)}
        <WhoAnswered people={p.people} />
      </>
    ),
    trip: (
      <>
        <TripBlock start={p.trip.start} end={p.trip.end} onClear={p.onClear} />
        {best(false)}
      </>
    ),
    forecast: (
      <View style={{ padding: space.lg }}>
        <DatesWeather view={p.weather.view} byDate={p.weather.byDate} openDay={p.weather.openDay} onSeePro={p.onSeePro} />
      </View>
    ),
  }[p.view];
  return <PanelBand>{body}</PanelBand>;
}