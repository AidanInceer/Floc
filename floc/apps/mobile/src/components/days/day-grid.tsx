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
 * THE WINDOW IS THE ONE THING NOT SHARED. `gridWindow` draws midnight to
 * midnight, which the browser hides behind a scrollbar; on a phone that is
 * twenty-four rows of nothing to push past with a thumb before reaching lunch.
 * `hoursShown` draws the hours the day actually uses instead, and never fewer
 * than `LEAST_HOURS` so an empty day is still recognisably a day.
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
import { Pressable, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

/** One hour's height. Tall enough that a half-hour block is still a tappable target. */
const HOUR = 52;

/** The window a day with nothing in it draws: a waking day, not a whole one. */
const QUIET_START = 8;
const QUIET_END = 21;

/** Fewer rows than this and the grid stops reading as a clock. */
const LEAST_HOURS = 6;

/** The hours to draw: what the day uses, widened to something a day's shape is legible in. */
function hoursShown(events: TimedLike[]): { startHour: number; endHour: number } {
  const spans = events.flatMap((event) => spanOf(event) ?? []);
  if (spans.length === 0) return { startHour: QUIET_START, endHour: QUIET_END };
  const startHour = Math.floor(Math.min(...spans.map((span) => span.start)) / 60);
  const endHour = Math.ceil(Math.max(...spans.map((span) => span.end)) / 60);
  return { startHour, endHour: Math.min(24, Math.max(endHour, startHour + LEAST_HOURS)) };
}

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
  onPress,
  style,
}: {
  type: DayEventType;
  title: string;
  when: string | null;
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
      <Text
        numberOfLines={2}
        style={{ color: c[`${ground}-ink`], fontFamily: fonts.sans, fontSize: size.small }}
      >
        {said}
      </Text>
    </Pressable>
  );
}

export function DayGrid({
  events,
  onPick,
}: {
  events: GridEvent[];
  /** Tapping a block edits it — the same tap the card list had. */
  onPick: (eventId: number) => void;
}) {
  const { c } = useTheme();
  const { startHour, endHour } = hoursShown(events);
  const top = startHour * 60;

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
    <View style={{ gap: space.md }}>
      {allDay.length + loose.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {[...allDay, ...loose].map((event) => (
            <EventBlock
              key={event.id}
              type={event.type}
              title={event.title ?? "Untitled"}
              when={event.allDay ? "All day" : "No time"}
              onPress={() => onPick(event.id)}
            />
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: "row" }}>
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
          {/* The rules are the hours. Drawn first so blocks sit over them. */}
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <View key={i} style={{ height: HOUR, borderTopWidth: 1, borderTopColor: c.rule }} />
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
      </View>
    </View>
  );
}
