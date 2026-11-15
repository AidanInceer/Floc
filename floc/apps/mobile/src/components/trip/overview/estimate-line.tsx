/** Your own range for the trip and how it sits against your budget (#574). Pro only, and only you see it. */
import { fitWords, wholeRange } from "@floc/core/money/estimate/words";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SectionGlyph } from "@/components/trip/section-glyph";
import { useTheme } from "@/components/system/theme";
import { ChevronGlyph } from "@/components/system/glyphs";
import { Pill } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { fonts, radius, size, space } from "@/lib/theme";

const FIT_TONE = { fits: "pastel-green", tight: "pastel-yellow", over: "pastel-red" } as const;

export function EstimateLine({ tripId, onOpen }: { tripId: number; onOpen: () => void }) {
  const { c } = useTheme();
  const estimate = useQuery(trpc.estimate.view.queryOptions({ tripId }));
  const view = estimate.data?.view;
  if (!view) return null;
  const { plan, currency } = view;
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={view.places ? `${wholeRange(plan.total, currency)} for you, open your budget` : "Open your budget"}
      style={({ pressed }) => ({
        gap: space.sm,
        padding: space.md,
        borderRadius: radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.rule,
        backgroundColor: pressed ? c["sheet-2"] : c.sheet,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <View style={{ width: 26, height: 26, borderRadius: radius.sm, backgroundColor: c["pastel-red"], alignItems: "center", justifyContent: "center" }}>
          <SectionGlyph route="money" color={c["pastel-red-ink"]} />
        </View>
        <Text style={{ flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: size.body }}>
          {view.places ? (
            <>
              <Text style={{ fontFamily: fonts.type, fontWeight: "600" }}>{wholeRange(plan.total, currency)}</Text> for you
            </>
          ) : "Add a place to see what this trip will cost you"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Text style={{ color: c.pen, fontFamily: fonts.sans, fontSize: size.small }}>Budget</Text>
          <View style={{ transform: [{ rotate: "-90deg" }] }}>
            <ChevronGlyph color={c.pen} />
          </View>
        </View>
      </View>
      {plan.fit ? <Pill sentence word={fitWords(plan.fit, currency)} tone={FIT_TONE[plan.fit.kind]} /> : null}
    </Pressable>
  );
}
