import { tripCoverage } from "@floc/core/dates/availability";
import { formatDate, nightsBetween, type IsoDate } from "@floc/core/dates/dates";
import { spanLabel } from "@floc/core/dates/dates-tabs";
import { whoTone } from "@floc/core/people/who";
import type { TripForecastView } from "@floc/api/port";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { DatesWeather } from "../days/dates-weather";
import type { ForecastDay } from "../days/weather-panel";
import { Button, Label } from "../system/ui";
import type { DatesView } from "@/lib/dates/day-look";
import { fonts, size, space } from "@/lib/theme";
import { countWord } from "@floc/core/text/count-word";
import { Face } from "../system/face";

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
  return <Block first name="In the trip" value={`${cover.free} of ${countWord(cover.total, "day")}`} note={note} />;
}

function BestSlot({ card, first }: { card: ReactNode; first: boolean }) {
  const { c } = useTheme();
  if (!card) return null;
  return <View style={{ borderTopWidth: first ? 0 : StyleSheet.hairlineWidth, borderTopColor: c.rule }}>{card}</View>;
}

export function TripBlock({ start, end, onClear }: { start: IsoDate | null; end: IsoDate | null; onClear: () => void }) {
  if (!start || !end) return <Block first name="The trip" value="No dates yet" note="Press the first day, then the last" />;
  return (
    <Block
      first
      name="The trip"
      value={spanLabel(start, end)}
      note={countWord(nightsBetween(start, end), "night")}
      action={<Button label="Clear" variant="quiet" fit="small" onPress={onClear} />}
    />
  );
}

function daysWord(days: number | null): string {
  if (days === null) return "Waiting";
  return days === 0 ? "No days" : countWord(days, "day");
}

export function WhoAnswered({ people, nudgeFor }: { people: Person[]; nudgeFor?: (id: string) => ReactNode }) {
  const { c } = useTheme();
  const answered = people.filter((p) => p.days !== null).length;
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
            <Face name={p.name} tone={tone} look="seat" />
            <Text numberOfLines={1} style={{ flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>
              {p.guest ? `${p.name} · guest` : p.name}
            </Text>
            {(p.days === null && nudgeFor?.(p.id)) || (
              <Text style={{ color: p.days !== null ? c["ink-3"] : c["highlight-ink"], fontFamily: fonts.type, fontSize: size.label + 1, fontVariant: ["tabular-nums"] }}>
                {daysWord(p.days)}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

type Person = { id: string; name: string; days: number | null; guest: boolean };

export function DatesPanel(p: {
  view: DatesView;
  trip: { start: IsoDate | null; end: IsoDate | null };
  isFree: (d: IsoDate) => boolean;
  bestCard: ReactNode;
  people: Person[];
  nudgeFor?: (id: string) => ReactNode;
  weather: { view: TripForecastView | undefined; byDate: Record<string, ForecastDay>; openDay: string | null };
  onClear: () => void;
  onSeePro: () => void;
}) {
  const body = {
    mine: <Coverage isFree={p.isFree} start={p.trip.start} end={p.trip.end} />,
    group: <WhoAnswered people={p.people} nudgeFor={p.nudgeFor} />,
    trip: (
      <>
        <TripBlock start={p.trip.start} end={p.trip.end} onClear={p.onClear} />
        <BestSlot card={p.bestCard} first={false} />
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