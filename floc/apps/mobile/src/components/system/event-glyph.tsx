// Why copied, not redrawn: the web's `EventGlyph` paths (`system/icons/days.tsx`), so a day's first thing is one picture on both.
import type { Pastel } from "@floc/core/design/pastels";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import type { DayEventType, TransportType } from "@floc/core/vocabulary";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "./theme";
import { radius } from "@/lib/theme";

const PATHS = {
  flight:
    "M11.6 2.4a1.1 1.1 0 0 1 0 1.6L9.4 6.2l.8 4.6-1.2 1-1.6-3.8-2 2v1.8l-1 .8-.9-2.3L1 9.4l.8-1h1.8l2-2L1.8 4.8l1-1.2 4.6.8 2.2-2.2a1.1 1.1 0 0 1 1.6 0z",
  train: "M5 1.8h4a2 2 0 0 1 2 2v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3.8a2 2 0 0 1 2-2zM3 6.4h8M5 12.2l1-2M9 12.2l-1-2",
  car: "M2 9.4V7.2l1.3-3a1 1 0 0 1 .9-.6h5.6a1 1 0 0 1 .9.6l1.3 3v2.2H2ZM2 7.2h10M3.4 10.9h2M8.6 10.9h2",
  ferry: "M2.2 8.2h9.6l-1.4 3H3.6ZM4.2 8.2V5.4h5.6v2.8M7 5.4V2.6",
  transport: "M2.4 7h9.2M8 3.4 11.6 7 8 10.6",
  food: "M4.2 1.8v4.2M2.8 1.8v2.6a1.4 1.4 0 0 0 2.8 0V1.8M4.2 6v6.2M10.2 12.2V1.8c-1.4.6-2.2 2-2.2 3.8v1.6h2.2",
  activity: "M1.9 4.2h10.2v1.7a1.1 1.1 0 0 0 0 2.2v1.7H1.9V8.1a1.1 1.1 0 0 0 0-2.2ZM8.6 4.2v5.6",
  other: "M7 2.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 1 0 0-9.6ZM7 6.1a.9.9 0 1 0 0 1.8.9.9 0 1 0 0-1.8Z",
} as const;

function pathFor(type: DayEventType, transportType: TransportType | null) {
  if (type !== "transport") return PATHS[type];
  return transportType && transportType !== "other" ? PATHS[transportType] : PATHS.transport;
}

/**
 * The ground each category sits on, on Days and the Overview alike. `EVENT_CATEGORIES` names it in Tailwind
 * classes the browser resolves; there is no cascade here, so the token is named again.
 */
const GROUND: Record<Exclude<DayEventType, "other">, Pastel> = {
  transport: "pastel-red",
  activity: "pastel-blue",
  food: "pastel-yellow",
};

// Other is grey, not a pastel: the recess it sits in, its edge and the softer ink.
export function groundOf(type: DayEventType, c: ReturnType<typeof useTheme>["c"]) {
  if (type === "other") return { fill: c["sheet-3"], edge: c["rule-2"], ink: c["ink-2"] };
  const g = GROUND[type];
  return { fill: c[g], edge: c[`${g}-edge`], ink: c[`${g}-ink`] };
}

/** A day's event as a small tile in its category's colour; the row beside it says what it is in words (#204). */
export function KindTile({ type, transportType }: { type: DayEventType; transportType: TransportType | null }) {
  const { c } = useTheme();
  const { fill, ink } = groundOf(type, c);
  return (
    <View
      accessibilityLabel={EVENT_CATEGORIES[type].label}
      style={{ width: 26, height: 26, borderRadius: radius.sm, backgroundColor: fill, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={13} height={13} viewBox="0 0 14 14" fill="none">
        <Path d={pathFor(type, transportType)} stroke={ink} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}
