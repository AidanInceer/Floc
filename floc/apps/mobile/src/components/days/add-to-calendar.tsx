import { subscribeUrl } from "@floc/core/itinerary/calendar-subscribe";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";

import { CalendarGlyph } from "@/components/system/glyphs";
import { Sheet } from "@/components/system/sheet";
import { useTheme } from "@/components/system/theme";
import { Body, Button } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { fonts, size, space } from "@/lib/theme";

export function AddToCalendar({ tripId }: { tripId: number }) {
  const queryClient = useQueryClient();
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const go = async (toUrl: (feed: string) => string) => {
    try {
      const feed = await queryClient.fetchQuery(trpc.itinerary.calendarUrl.queryOptions({ tripId }));
      await Linking.openURL(toUrl(feed));
      setOpen(false);
    } catch {
      setProblem("Your calendar could not be opened.");
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add to calendar"
        hitSlop={space.sm}
        onPress={() => {
          setProblem(null);
          setOpen(true);
        }}
        style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.xs, paddingHorizontal: space.sm, opacity: pressed ? 0.6 : 1 })}
      >
        <CalendarGlyph color={c["ink-2"]} />
        <Text style={{ color: c["ink-2"], fontFamily: fonts.sansBold, fontSize: size.small }}>Calendar</Text>
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <View style={{ padding: space.lg, gap: space.md }}>
          <Button
            label="Keep in sync"
            onPress={() => go((feed) => subscribeUrl(feed, Platform.OS === "ios" ? "ios" : "android"))}
          />
          <Body tone="ink-3">Changes to the trip show up in your calendar.</Body>
          <Button label="Download a copy" variant="quiet" onPress={() => go((feed) => feed)} />
          <Body tone="ink-3">Does not update when plans change.</Body>
          {problem ? <Body tone="red">{problem}</Body> : null}
        </View>
      </Sheet>
    </>
  );
}
