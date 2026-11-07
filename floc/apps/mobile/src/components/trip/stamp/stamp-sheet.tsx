import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pastelOf } from "@floc/core/design/pastels";
import { TRIP_MARKS, TRIP_MARK_LABELS, type TripMark } from "@floc/core/trip/mark/trip-mark";
import { TRIP_COLORS, type TripColor } from "@floc/core/trip/trip-color";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { trpc } from "@/lib/api";
import { colourPatch, markPatch } from "@/lib/trip/stamp-patch";
import { radius, space } from "@/lib/theme";
import { Sheet } from "../../system/sheet";
import { useTheme } from "../../system/theme";
import { Body, Heading, Label } from "../../system/ui";
import { TripMarkIcon } from "../trip-mark";

const CELL = 44;
const COLUMNS = 5;

export function StampSheet({
  open,
  onClose,
  tripId,
  color: savedColor,
  mark: savedMark,
}: {
  open: boolean;
  onClose: () => void;
  tripId: number;
  color: TripColor | null;
  mark: TripMark | null;
}) {
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const [color, setColor] = useState(savedColor);
  const [mark, setMark] = useState(savedMark);
  useEffect(() => {
    setColor(savedColor);
    setMark(savedMark);
  }, [savedColor, savedMark]);
  const save = useMutation({
    ...trpc.trips.update.mutationOptions(),
    onError: () => {
      setColor(savedColor);
      setMark(savedMark);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: trpc.trips.get.queryKey({ tripId }) });
      void queryClient.invalidateQueries({ queryKey: trpc.trips.list.queryKey() });
    },
  });

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.lg }}>
        <Heading>Colour and mark</Heading>

        <View style={{ gap: space.sm }}>
          <Label>Colour</Label>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            {TRIP_COLORS.map((option) => {
              const picked = color === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={option}
                  accessibilityState={{ selected: picked }}
                  onPress={() => {
                    setColor(option);
                    save.mutate(colourPatch(tripId, option));
                  }}
                  style={{ width: CELL, height: CELL, alignItems: "center", justifyContent: "center" }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: radius.pill,
                      backgroundColor: c[pastelOf(option)],
                      borderWidth: picked ? 2 : 1,
                      borderColor: picked ? c["pen-deep"] : c["rule-2"],
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: space.sm }}>
          <Label>Icon</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", width: CELL * COLUMNS + space.sm * (COLUMNS - 1), gap: space.sm }}>
            {TRIP_MARKS.map((option) => {
              const picked = mark === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={TRIP_MARK_LABELS[option]}
                  accessibilityState={{ selected: picked }}
                  onPress={() => {
                    setMark(mark === option ? null : option);
                    save.mutate(markPatch(tripId, mark, option));
                  }}
                  style={{
                    width: CELL,
                    height: CELL,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: radius.sm,
                    backgroundColor: picked ? c["pen-2"] : "transparent",
                    borderWidth: picked ? 1.5 : StyleSheet.hairlineWidth,
                    borderColor: picked ? c["pen-deep"] : c.rule,
                  }}
                >
                  <TripMarkIcon mark={option} color={picked ? c["pen-deep"] : c["ink-2"]} size={21} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {save.isError ? (
          <Body tone="red">Could not save that. Check your connection and try again.</Body>
        ) : null}
      </View>
    </Sheet>
  );
}
