/**
 * The itinerary (ticket 291).
 *
 * DAY-FIRST (rule 3). The list is days; events hang off a day. There is no
 * stop here at all — Overview derives those. Reordering within a day is
 * deliberately not built yet: it needs a drag affordance that is its own piece
 * of work, and a phone that can add and edit events is already parity for what
 * the ticket asks.
 *
 * TIMES ARE LOCAL TO THE ITINERARY (rule 10). `HH:MM` is displayed exactly as
 * stored. Nothing here consults the device clock or its timezone, so a plan
 * made in Lisbon reads the same on a phone still set to London.
 */
import { orderEvents } from "@floc/core/event-order";
import { formatDate } from "@floc/core/dates";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { useTheme } from "@/components/theme";
import { Body, Button, Card, Divider, Empty, Failed, Field, Figure, Label, Loading } from "@/components/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export default function Itinerary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const { c } = useTheme();
  const queryClient = useQueryClient();

  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  const days = useQuery(trpc.itinerary.days.queryOptions({ tripId }));

  const addEvent = useMutation({
    ...trpc.itinerary.addEvent.mutationOptions(),
    onSuccess: () => {
      setAddingTo(null);
      setTitle("");
      setTime("");
      queryClient.invalidateQueries({ queryKey: trpc.itinerary.days.queryKey({ tripId }) });
    },
  });

  if (days.isPending) return <Loading />;
  if (days.isError) return <Failed onRetry={() => days.refetch()} />;

  // No days is normal, and it does not mean no dates: days appear only once a
  // window is committed on the Dates tab, which is web-only for now — exactly
  // as it is for a trip created in a browser. Saying "set the dates" would be
  // wrong for a trip that already has them (rule 9).
  if (days.data.length === 0) {
    return <Empty>No days yet — pick the trip&apos;s window on floc.app.</Empty>;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      {days.data.map((day) => (
        <View key={day.id} style={{ gap: space.sm }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Label>{formatDate(day.date)}</Label>
            {day.overnightPlaceName ? (
              <Body tone="ink-3">{day.overnightPlaceName}</Body>
            ) : null}
          </View>

          <Card>
            {day.events.length === 0 ? (
              <Body tone="ink-3">Nothing planned.</Body>
            ) : (
              // Same ordering rule as the web app — timed events by time, then
              // all-day, and never a second opinion about it.
              orderEvents(day.events).map((event, i) => (
                <View key={event.id} style={{ gap: space.sm }}>
                  {i > 0 ? <Divider /> : null}
                  <View style={{ flexDirection: "row", gap: space.md, alignItems: "baseline" }}>
                    <Figure tone="ink-3">{event.allDay ? "All day" : (event.time ?? "—")}</Figure>
                    <View style={{ flex: 1 }}>
                      <Body>{event.title}</Body>
                      {event.note ? <Body tone="ink-2">{event.note}</Body> : null}
                    </View>
                  </View>
                </View>
              ))
            )}
          </Card>

          {addingTo === day.id ? (
            <Card>
              <Field label="What" value={title} onChangeText={setTitle} autoFocus />
              <Field
                label="Time (HH:MM, optional)"
                value={time}
                onChangeText={setTime}
                keyboardType="numbers-and-punctuation"
                placeholder="09:30"
              />
              <Button
                label="Add"
                busy={addEvent.isPending}
                onPress={() =>
                  addEvent.mutate({
                    tripId,
                    dayId: day.id,
                    event: {
                      type: "activity",
                      title: title.trim(),
                      // Empty means untimed, which is an all-day event — not a
                      // blank time, which the API would refuse.
                      allDay: time.trim() === "",
                      time: time.trim() || null,
                    },
                  })
                }
              />
              <Button label="Cancel" variant="quiet" onPress={() => setAddingTo(null)} />
              {addEvent.isError ? <Body tone="red">{addEvent.error.message}</Body> : null}
            </Card>
          ) : (
            <Pressable onPress={() => setAddingTo(day.id)} accessibilityRole="button">
              <Body tone="pen">Add something</Body>
            </Pressable>
          )}
        </View>
      ))}
      <View style={{ height: space.xxl, backgroundColor: c.paper }} />
    </ScrollView>
  );
}
