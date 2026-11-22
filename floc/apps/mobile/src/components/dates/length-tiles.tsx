import { TRIP_LENGTHS, TRIP_LENGTH_SPECS, lengthSummary, type LengthChoice, type TripLength } from "@floc/core/dates/finding/trip-length";
import { DATES_NOT_SAVED } from "@floc/core/dates/words";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { TickGlyph } from "../system/glyphs";
import { Body } from "../system/ui";
import { trpc } from "@/lib/api";
import { picksOf, withPicks } from "@/lib/dates/length-choices";
import { fonts, radius, size, space } from "@/lib/theme";

function Tile({ length, on, onPress }: { length: TripLength; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const spec = TRIP_LENGTH_SPECS[length];
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${spec.label}, ${spec.nights}`}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        minHeight: 44,
        paddingHorizontal: space.md,
        borderRadius: radius.sm,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: on ? c["ink-2"] : c.rule,
        backgroundColor: c.sheet,
      }}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: radius.pill,
          borderWidth: on ? 0 : 1.5,
          borderColor: c["rule-2"],
          backgroundColor: on ? c.ink : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {on ? <TickGlyph color={c.sheet} /> : null}
      </View>
      <Text style={{ flex: 1, color: c.ink, fontFamily: fonts.sansBold, fontSize: size.small }}>{spec.label}</Text>
      <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{spec.nights}</Text>
    </Pressable>
  );
}

export function LengthTiles({ tripId, viewerId, choices }: { tripId: number; viewerId: string; choices: LengthChoice[] }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<Partial<Record<TripLength, boolean>>>({});
  const [failed, setFailed] = useState(false);
  const save = useMutation(trpc.availability.setLength.mutationOptions());
  const mine = { ...picksOf(choices, viewerId), ...pending };
  const summary = lengthSummary(withPicks(choices, viewerId, mine));

  function press(length: TripLength) {
    const picked = !mine[length];
    setPending((current) => ({ ...current, [length]: picked }));
    setFailed(false);
    save.mutate(
      { tripId, length, picked },
      {
        onError: () => setFailed(true),
        onSettled: async () => {
          await queryClient.invalidateQueries({ queryKey: trpc.availability.lengths.queryKey({ tripId }) });
          setPending((current) => {
            const next = { ...current };
            delete next[length];
            return next;
          });
        },
      },
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <Body bold>How long</Body>
      <View style={{ gap: space.sm }}>
        {TRIP_LENGTHS.map((length) => (
          <Tile key={length} length={length} on={mine[length]} onPress={() => press(length)} />
        ))}
      </View>
      {failed ? <Body tone="red">{DATES_NOT_SAVED}</Body> : null}
      {summary ? <Body tone="ink-2">{summary}</Body> : null}
    </View>
  );
}
