import { subscribeUrl } from "@floc/core/itinerary/calendar-subscribe";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Linking, Platform, Pressable, Text, View } from "react-native";

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
  const reset = useMutation(
    trpc.itinerary.resetCalendarUrl.mutationOptions({
      onSuccess: (url) => {
        setProblem(null);
        queryClient.setQueryData(trpc.itinerary.calendarUrl.queryKey({ tripId }), url);
      },
      onError: () => setProblem("Link not reset. Try again."),
    }),
  );

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
          reset.reset();
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
          <Button
            label="Reset link"
            variant="quiet"
            busy={reset.isPending}
            onPress={() =>
              Alert.alert(
                "Reset your calendar link?",
                "The old link stops working in every calendar that holds it. Everyone else on the trip keeps theirs.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Reset the link", style: "destructive", onPress: () => reset.mutate({ tripId }) },
                ],
              )
            }
          />
          <Body tone="ink-3">
            {reset.isSuccess ? "Link reset. Add the new one." : "The old link stops working."}
          </Body>
          {problem ? <Body tone="red">{problem}</Body> : null}
        </View>
      </Sheet>
    </>
  );
}
