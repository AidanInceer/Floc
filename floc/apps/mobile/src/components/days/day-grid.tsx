import { packLanes, spanOf, type TimedLike } from "@floc/core/dates/calendar";
import { EVENT_CATEGORIES } from "@floc/core/itinerary/event-categories";
import type { DayEventType, TransportType } from "@floc/core/vocabulary";
import { Pressable, ScrollView, Text, View } from "react-native";

import { EventMark, groundOf } from "../system/event-glyph";
import { ClipGlyph, NoteGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";
import { eventName } from "@floc/core/itinerary/names/event-name";

const HOUR = 52;

const START_HOUR = 0;
const END_HOUR = 24;

const GUTTER = 44;

export type GridEvent = TimedLike & {
  type: DayEventType;
  transportType: TransportType | null;
  title: string | null;
  note: string | null;
  placeName: string | null;
};

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

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
  height: number | null;
  hasFiles: boolean;
  onPress: () => void;
  style?: object;
}) {
  const { c } = useTheme();
  const ground = groundOf(event.type, c);
  const title = eventName(event);
  const place = event.title !== null ? event.placeName : null;
  const spoken = [when, title, place, EVENT_CATEGORIES[event.type].label].filter(Boolean).join(" · ");
  const stacked = height !== null && height >= 44;
  const placed = height !== null && height >= 78 && place;
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
  withFiles: Set<number>;
  onPick: (eventId: number) => void;
  onAddAt: (time: string) => void;
}) {
  const { c } = useTheme();
  const top = START_HOUR * 60;
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const firstSpan = Math.min(...events.flatMap((event) => spanOf(event)?.start ?? []), END_HOUR * 60);
  const opensAt = Math.max(0, Math.floor(firstSpan / 60) - 1 - START_HOUR) * HOUR;

  const allDay = events.filter((event) => event.allDay);
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
              const when = !found.span.open && endTime ? `${time}–${endTime}` : (time ?? "");
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