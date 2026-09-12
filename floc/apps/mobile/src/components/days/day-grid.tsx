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
 * `EVENT_CATEGORIES` in `@floc/core`. Blush is getting somewhere, peri is
 * doing something, butter is eating. Every block still says its title, so the
 * colour is a second signal and never the only one (#204).
 *
 * AN OPEN-ENDED EVENT IS DRAWN, NOT INVENTED. `spanOf` gives it a nominal
 * length so it has a height; the block says its start time only, because the
 * end is not known and a drawn box must not claim one (#126).
 */
import { packLanes, spanOf, type TimedLike } from "@floc/core/dates/calendar";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import type { DayEventType } from "@floc/core/vocabulary";
import { Pressable, ScrollView, Text, View } from "react-native";

import { ClipGlyph, PenGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** One hour's height. Tall enough that a half-hour block is still a tappable target. */
const HOUR = 52;

/** Midnight to midnight. Rule 10: these are itinerary hours, not the device's. */
const START_HOUR = 0;
const END_HOUR = 24;

/** Room for "09", left of the rules. */
const GUTTER = 34;

export type GridEvent = TimedLike & {
  type: DayEventType;
  title: string | null;
  note: string | null;
};

/**
 * The ground each category sits on. `EVENT_CATEGORIES` names it in Tailwind
 * classes the browser resolves; there is no cascade here, so the token name is
 * read out of the class and looked up in the palette.
 */
const GROUND: Record<DayEventType, string> = {
  transport: "blush",
  activity: "peri",
  food: "butter",
};

/**
 * A block, or the all-day chip: same tap, same look, different place.
 *
 * ONE LINE, NOT TWO. A half-hour block is 26 points tall, which fits one line
 * of type — stacking the time above the title clipped every short event down
 * to its clock face and hid the thing you were looking for.
 */
function EventBlock({
  type,
  title,
  when,
  hasNote,
  hasFiles,
  onPress,
  style,
}: {
  type: DayEventType;
  title: string;
  when: string | null;
  hasNote: boolean;
  hasFiles: boolean;
  onPress: () => void;
  style?: object;
}) {
  const { c } = useTheme();
  const ground = GROUND[type];
  const said = [when, title].filter(Boolean).join(" · ");
  // The category is a word here, so the colour is never carrying it alone (#204).
  const spoken = `${said} · ${EVENT_CATEGORIES[type].label}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      onPress={onPress}
      style={[
        {
          backgroundColor: c[ground],
          borderColor: c[`${ground}-edge`],
          borderWidth: 1,
          borderRadius: radius.sm,
          paddingHorizontal: space.sm,
          paddingVertical: 2,
          justifyContent: "center",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Text
          numberOfLines={2}
          style={{
            flexShrink: 1,
            color: c[`${ground}-ink`],
            fontFamily: fonts.sans,
            fontSize: size.small,
          }}
        >
          {said}
        </Text>
        {/* The marks say only "more inside" — the modal is the real answer, so
            the label above already carries everything a reader is told. */}
        {hasNote ? <PenGlyph color={c[`${ground}-ink`]} /> : null}
        {hasFiles ? <ClipGlyph color={c[`${ground}-ink`]} /> : null}
      </View>
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
  const startHour = START_HOUR;
  const endHour = END_HOUR;
  const top = startHour * 60;

  // An hour above the first thing planned, so the block is not flush with the
  // top edge and the hour before it reads as free.
  const firstSpan = Math.min(
    ...events.flatMap((event) => spanOf(event)?.start ?? []),
    END_HOUR * 60,
  );
  const opensAt = Math.max(0, Math.floor(firstSpan / 60) - 1 - startHour) * HOUR;

  const allDay = events.filter((event) => event.allDay);
  // Anything with no start time at all sits with the all-day chips rather than
  // being dropped: the grid has nowhere to put it, and losing it is worse.
  const loose = events.filter((event) => !event.allDay && spanOf(event) === null);

  const timed = events.flatMap((event) => {
    const span = spanOf(event);
    return span ? [{ event, span }] : [];
  });
  const packed = packLanes(timed.map((t) => ({ id: t.event.id, start: t.span.start, end: t.span.end })));

  return (
    <View style={{ flex: 1, gap: space.md }}>
      {allDay.length + loose.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {[...allDay, ...loose].map((event) => (
            <EventBlock
              key={event.id}
              type={event.type}
              title={event.title ?? "Untitled"}
              when={event.allDay ? "All day" : "No time"}
              hasNote={Boolean(event.note)}
              hasFiles={withFiles.has(event.id)}
              onPress={() => onPick(event.id)}
            />
          ))}
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentOffset={{ x: 0, y: opensAt }}
        contentContainerStyle={{ flexDirection: "row", paddingBottom: space.lg }}
      >
        <View style={{ width: GUTTER }}>
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <View key={i} style={{ height: HOUR }}>
              <Text
                style={{
                  color: c["ink-3"],
                  fontFamily: fonts.type,
                  fontSize: size.label,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {String(startHour + i).padStart(2, "0")}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          {/* The rules are the hours, and each one is where an event at that
              hour is started. Drawn first so blocks sit over them — a press
              that lands on a block opens the block instead. */}
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Add something at ${String(startHour + i).padStart(2, "0")}:00`}
              onPress={() => onAddAt(`${String(startHour + i).padStart(2, "0")}:00`)}
              style={{ height: HOUR, borderTopWidth: 1, borderTopColor: c.rule }}
            />
          ))}

          {packed.map((block) => {
            const found = timed.find((t) => t.event.id === block.id);
            if (!found) return null;
            const width = `${100 / block.lanes}%` as const;
            return (
              <EventBlock
                key={block.id}
                type={found.event.type}
                title={found.event.title ?? "Untitled"}
                // Open-ended events say their start and nothing else — the box's
                // height is a drawing, not a claim about when it finishes.
                when={found.event.time}
                hasNote={Boolean(found.event.note)}
                hasFiles={withFiles.has(found.event.id)}
                onPress={() => onPick(block.id)}
                style={{
                  position: "absolute",
                  top: ((block.start - top) / 60) * HOUR,
                  height: Math.max(((block.end - block.start) / 60) * HOUR - 2, 24),
                  left: `${(100 / block.lanes) * block.lane}%`,
                  width,
                  marginLeft: space.xs,
                }}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
