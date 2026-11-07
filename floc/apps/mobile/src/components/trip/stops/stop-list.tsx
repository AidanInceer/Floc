// Why: the web Overview's Stops, drawn tighter — a card a stop with its days, the journey between them on a dashed line.
import type { DayEvent } from "@floc/api/port";
import { formatDate, formatShortRange } from "@floc/core/dates/dates";
import { nightsLabel } from "@floc/core/itinerary/stops";
import { hopLabel, type Leg, type LegFile } from "@floc/core/trip/overview/legs";
import { Fragment } from "react";
import { Text, View } from "react-native";

import { RibbonGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { TravelModeGlyph } from "../../system/travel-mode-glyph";
import { StopDayRow } from "./stop-day-row";
import { fonts, radius, size, space } from "@/lib/theme";

type Named = LegFile & { name: string };

/** "Lisbon, Portugal" is "Lisbon" here; the country is on the map. */
const cityOf = (placeName: string) => placeName.split(",")[0];

export function StopList({ legs, events, onOpen }: { legs: Leg<Named>[]; events: Map<number, DayEvent[]>; onOpen: (date: string) => void }) {
  return (
    <View>
      {legs.map((leg) => (
        <Fragment key={leg.days[0].dayId}>
          {leg.no > 1 ? <Arrival leg={leg} /> : null}
          <StopCard leg={leg} events={events} onOpen={onOpen} />
        </Fragment>
      ))}
    </View>
  );
}

function Arrival({ leg }: { leg: Leg<Named> }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        marginLeft: 28,
        minHeight: 34,
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        paddingLeft: 14,
        borderLeftWidth: 1.5,
        borderLeftColor: c["rule-2"],
        borderStyle: "dashed",
      }}
    >
      {leg.mode ? <TravelModeGlyph mode={leg.mode} color={c["ink-3"]} size={14} /> : null}
      <Text style={{ flexShrink: 1, color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label }}>
        {`${hopLabel(leg.mode, cityOf(leg.placeName))} · ${formatDate(leg.arrive)}`}
      </Text>
    </View>
  );
}

function StopCard({ leg, events, onOpen }: { leg: Leg<Named>; events: Map<number, DayEvent[]>; onOpen: (date: string) => void }) {
  const { c } = useTheme();
  return (
    <View
      testID={`leg-${leg.no}`}
      style={{ backgroundColor: c.sheet, borderColor: c["rule-2"], borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, paddingTop: space.lg, paddingBottom: space.xs }}
    >
      {leg.stay ? (
        <View accessible accessibilityLabel={`Booked: ${leg.stay.name}`} style={{ position: "absolute", top: -1, right: space.lg }}>
          <RibbonGlyph color={c["pastel-green-ink"]} />
        </View>
      ) : null}
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={`Stop ${leg.no}, ${leg.placeName}, ${nightsLabel(leg.nights)}`}
        style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.md, rowGap: 2, paddingRight: leg.stay ? space.xl : 0, marginBottom: space.md }}
      >
        <View style={{ paddingRight: space.md, borderRightWidth: 1.5, borderRightColor: c["rule-2"] }}>
          <Text style={{ color: c.pen, fontFamily: fonts.display, fontSize: size.heading, fontVariant: ["tabular-nums"] }}>{leg.no}</Text>
        </View>
        <Text style={{ color: c.ink, fontFamily: fonts.display, fontSize: size.heading, letterSpacing: -0.4 }}>{cityOf(leg.placeName)}</Text>
        <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>
          {`${nightsLabel(leg.nights)} · ${formatShortRange(leg.arrive, leg.leave)}`}
        </Text>
      </View>
      {leg.days.map((d) => (
        <StopDayRow key={d.dayId} date={d.date} events={events.get(d.dayId) ?? []} onOpen={() => onOpen(d.date)} />
      ))}
    </View>
  );
}
