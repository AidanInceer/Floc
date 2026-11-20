import { wholeRange } from "@floc/core/money/estimate/words";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

import { SectionGlyph } from "@/components/trip/section-glyph";
import { useTheme } from "@/components/system/theme";
import { ChevronGlyph } from "@/components/system/glyphs";
import { trpc } from "@/lib/api";
import { fonts, size } from "@/lib/theme";
import { LineRow } from "./line-row";

export function EstimateRow({ tripId, onOpen }: { tripId: number; onOpen: () => void }) {
  const { c } = useTheme();
  const estimate = useQuery(trpc.estimate.view.queryOptions({ tripId }));
  const view = estimate.data?.view;
  if (!view) return null;
  const { plan, currency } = view;
  return (
    <LineRow onPress={onOpen} label={view.places ? `${wholeRange(plan.total, currency)} estimated for you, open your budget` : "Open your budget"}>
      <SectionGlyph route="money" color={c["pastel-red-ink"]} />
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        <Text style={{ color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>
          {view.places ? (
            <>
              <Text style={{ fontFamily: fonts.type, fontWeight: "600" }}>{wholeRange(plan.total, currency)}</Text> estimated for you
            </>
          ) : "Add a place to start a budget"}
        </Text>
      </View>
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <ChevronGlyph color={c["ink-3"]} />
      </View>
    </LineRow>
  );
}
