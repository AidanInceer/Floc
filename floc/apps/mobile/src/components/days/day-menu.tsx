import { DAY_REMOVAL_TITLE, dayRemovalMessage } from "@floc/core/itinerary/day-removal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable } from "react-native";

import { MoreGlyph } from "@/components/system/glyphs";
import { Sheet } from "@/components/system/sheet";
import { Body, IconButton } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

const failed = (message: string) => Alert.alert("Day not removed", message);

export function DayMenu({ tripId, dayId }: { tripId: number; dayId: number }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const remove = useMutation(
    trpc.itinerary.removeDay.mutationOptions({
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.itinerary.days.queryKey({ tripId }) }),
          queryClient.invalidateQueries({ queryKey: trpc.trips.get.queryKey({ tripId }) }),
        ]),
      onError: (error) => failed(error.message),
    }),
  );

  const confirm = async () => {
    setOpen(false);
    try {
      const plan = await queryClient.fetchQuery({
        ...trpc.itinerary.removalPlan.queryOptions({ tripId, dayId }),
        staleTime: 0,
      });
      Alert.alert(DAY_REMOVAL_TITLE, dayRemovalMessage(plan), [
        { text: "Cancel", style: "cancel" },
        { text: "Remove day", style: "destructive", onPress: () => remove.mutate({ tripId, dayId }) },
      ]);
    } catch {
      failed("Check your connection and try again.");
    }
  };

  return (
    <>
      <IconButton label="Day options" disabled={remove.isPending} onPress={() => setOpen(true)}>
        {(color) => <MoreGlyph color={color} />}
      </IconButton>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove day"
          testID="remove-day"
          onPress={confirm}
          style={({ pressed }) => ({ minHeight: 48, justifyContent: "center", paddingHorizontal: space.lg, opacity: pressed ? 0.6 : 1 })}
        >
          <Body tone="red">Remove day</Body>
        </Pressable>
      </Sheet>
    </>
  );
}
