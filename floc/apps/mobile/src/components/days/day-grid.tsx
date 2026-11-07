/**
 * One day as a calendar (#302) — hours down, events as blocks.
 *
 * WHY THIS AND NOT A LIST. The phone drew a day as a stack of cards, each
 * printing its own time. That is a list of events that happen to be sorted; it
 * does not show a gap, an overlap, or a morning with nothing in it. The web
 * app draws hours-down-days-across, and the two apps disagreeing about what an
 * itinerary *looks like* is the disagreement worth fixing.
 *
 * ONE DAY, NOT A WEEK. That is the one deliberate difference. A phone has one
 * column; the day strip above is the "days across" axis, spread over time
 * rather than over the screen.
 *
 * THE GEOMETRY IS SHARED, NOT REBUILT. `spanOf` and `packLanes` are
 * `@floc/core/calendar` — the same functions the browser positions with — so a
 * 09:30 block starts a third of the way down an hour in both apps, and an
 * overlap swims into the same lanes.
 *
 * THE WHOLE DAY IS DRAWN, midnight to midnight, the same window the browser
 * draws. Cropping to the hours in use saved a thumb-scroll and cost the thing
 * the grid is for: an empty evening only reads as free if it is on the screen.
 *
 * AN EMPTY HOUR IS THE ADD CONTROL. Pressing one starts an event at that time
 * — which is where somebody is already pointing — instead of a button above
 * the grid that starts one at no time at all.
 *
 * IT SCROLLS ITSELF, AND OPENS ON THE FIRST EVENT. Drawing the whole day put
 * breakfast eight hours below the fold; the grid arrives at the first thing
 * planned, and the small hours are still there above it for anyone whose
 * flight leaves at four.
 *
 * TIMES ARE LOCAL TO THE ITINERARY (rule 10). `HH:MM` is drawn exactly as
 * stored. Nothing here reads the device clock or a timezone.
 *
 * COLOUR COMES FROM THE CATEGORY, and from the same table the website reads —
 * `EVENT_CATEGORIES` in `@floc/core`. Red is getting somewhere, blue is
 * doing something, yellow is eating. Every block still says its title, so the
 * colour is a second signal and never the only one (#204).
 *
 * AN OPEN-ENDED EVENT IS DRAWN, NOT INVENTED. `spanOf` gives it a nominal
 * length so it has a height; the block says its start time only, because the
 * end is not known and a drawn box must not claim one (#126).
 */
import { packLanes, spanOf, type TimedLike } from "@floc/core/dates/calendar";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import type { DayEventType, TransportType } from "@floc/core/vocabulary";
import { Pressable, ScrollView, Text, View } from "react-native";

import { EventMark, groundOf } from "../system/event-glyph";
import { ClipGlyph, NoteGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** One hour's height. Tall enough that a half-hour block is still a tappable target. */
const HOUR = 52;

/** Midnight to midnight. Rule 10: these are itinerary hours, not the device's. */
const START_HOUR = 0;
const END_HOUR = 24;

/** Room for "09:00", left of the rules. */
const GUTTER = 44;

export type GridEvent = TimedLike & {
  type: DayEventType;
  transportType: TransportType | null;
  title: string | null;
  note: string | null;
  placeName: string | null;
};

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

// Why lines by height: as on the web, a block says its time, then its title, then its place, as far as its height allows; a half-hour block keeps one line.
function EventBlock({
  event,
  when,
  height,
  hasFiles,
  onPress,
  style,
}: {
  event: GridEvent;
  when: string;
  /** Null for a chip above the grid, which keeps to one line. */
  height: number | null;
  hasFiles: boolean;
  onPress: () => void;
  style?: object;
}) {
  const { c } = useTheme();
  const ground = groundOf(event.type, c);
  const title = event.title ?? "Untitled";
  // The category is a word here, so the colour is never carrying it alone (#204).
  const spoken = [when, title, event.placeName, EVENT_CATEGORIES[event.type].label].filter(Boolean).join(" · ");
  const stacked = height !== null && height >= 44;
  const placed = height !== null && height >= 78 && event.placeName;
  const small = { color: ground.ink, fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums" as const] };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      onPress={onPress}
      style={[
        {
          backgroundColor: ground.fill,
          borderColor: ground.edge,
          borderWidth: 1,
          borderRadius: radius.sm,
          paddingHorizontal: space.sm,
          paddingVertical: stacked ? space.xs + 2 : 2,
          justifyContent: stacked ? "flex-start" : "center",
          overflow: "hidden",
          gap: 2,
        },
        style,
      ]}
    >
      {stacked ? <Text style={small}>{when}</Text> : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
        <Text numberOfLines={stacked && height >= 64 ? 2 : 1} style={{ flexShrink: 1, color: ground.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>
          {stacked ? title : `${when} · ${title}`}
        </Text>
        {/* The marks say only "more inside"; the modal is the real answer. */}
        {event.note ? <NoteGlyph color={ground.ink} /> : null}
        {hasFiles ? <ClipGlyph color={ground.ink} /> : null}
      </View>
      {placed ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
          <EventMark type={event.type} transportType={event.transportType} color={ground.ink} />
          <Text numberOfLines={1} style={{ flexShrink: 1, color: ground.ink, fontFamily: fonts.sans, fontSize: size.label + 1 }}>
            {event.placeName}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
export function DayGrid({
  events,
  withFiles,
  onPick,
  onAddAt,
}: {
  events: GridEvent[];
  /** The ids wearing a clip (ticket 324) — the whole trip's, so the strip can move without a second read. */
  withFiles: Set<number>;
  /** Tapping a block opens it — the same tap the card list had. */
  onPick: (eventId: number) => void;
  /** Tapping an empty hour starts one there, `HH:MM` (rule 10 — itinerary time). */
  onAddAt: (time: string) => void;
}) {
  const { c } = useTheme();
  const top = START_HOUR * 60;
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  // An hour above the first thing planned, so the block is not flush with the top edge.
  const firstSpan = Math.min(...events.flatMap((event) => spanOf(event)?.start ?? []), END_HOUR * 60);
  const opensAt = Math.max(0, Math.floor(firstSpan / 60) - 1 - START_HOUR) * HOUR;

  const allDay = events.filter((event) => event.allDay);
  // Anything with no start time sits with the all-day chips: the grid has nowhere to put it, and losing it is worse.
  const loose = events.filter((event) => !event.allDay && spanOf(event) === null);

  const timed = events.flatMap((event) => {
    const span = spanOf(event);
    return span ? [{ event, span }] : [];
  });
  const packed = packLanes(timed.map((t) => ({ id: t.event.id, start: t.span.start, end: t.span.end })));

  return (
    <View style={{ flex: 1, gap: space.sm }}>
      {allDay.length + loose.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, paddingLeft: GUTTER }}>
          {[...allDay, ...loose].map((event) => (
            <EventBlock
              key={event.id}
              event={event}
              when={event.allDay ? "All day" : "No time"}
              height={null}
              hasFiles={withFiles.has(event.id)}
              onPress={() => onPick(event.id)}
            />
          ))}
        </View>
      ) : null}

      <ScrollView style={{ flex: 1 }} contentOffset={{ x: 0, y: opensAt }} contentContainerStyle={{ paddingTop: space.sm, paddingBottom: space.lg }}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: GUTTER }}>
            {hours.map((h) => (
              <View key={h} style={{ height: HOUR }}>
                <Text style={{ marginTop: -7, color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{hh(h)}</Text>
              </View>
            ))}
          </View>

          <View style={{ flex: 1 }}>
            {/* The rules are the hours, and each one starts an event at that hour. Drawn first so a press on a block opens the block. */}
            {hours.map((h) => (
              <Pressable
                key={h}
                accessibilityRole="button"
                accessibilityLabel={`Add something at ${hh(h)}`}
                onPress={() => onAddAt(hh(h))}
                style={{ height: HOUR, borderTopWidth: 1, borderTopColor: c.rule }}
              />
            ))}

            {packed.map((block) => {
              const found = timed.find((t) => t.event.id === block.id);
              if (!found) return null;
              const height = Math.max(((block.end - block.start) / 60) * HOUR - 2, 24);
              const { time, endTime } = found.event;
              // Open-ended events say their start only: the box's height is a drawing, not a claim (#126).
              const when = !found.span.open && endTime ? `${time}–${endTime}` : (time ?? "");
              // Why: a %-width plus a margin ran the last lane off the right edge; the gap now sits inside the lane.
              return (
                <View
                  key={block.id}
                  style={{
                    position: "absolute",
                    top: ((block.start - top) / 60) * HOUR + 1,
                    height,
                    left: `${(100 / block.lanes) * block.lane}%`,
                    width: `${100 / block.lanes}%`,
                    paddingLeft: space.xs,
                  }}
                >
                  <EventBlock event={found.event} when={when} height={height} hasFiles={withFiles.has(found.event.id)} onPress={() => onPick(block.id)} style={{ flex: 1 }} />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}