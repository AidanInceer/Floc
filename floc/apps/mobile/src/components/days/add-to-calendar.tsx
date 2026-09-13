import { subscribeUrl } from "@floc/core/itinerary/calendar-subscribe";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Linking, Platform, View } from "react-native";

import { Sheet } from "@/components/system/sheet";
import { Body, Button } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export function AddToCalendar({ tripId }: { tripId: number }) {
  const queryClient = useQueryClient();
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
      <Button
        label="Add to calendar"
        variant="quiet"
        fit="small"
        onPress={() => {
          setProblem(null);
          setOpen(true);
        }}
      />
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
