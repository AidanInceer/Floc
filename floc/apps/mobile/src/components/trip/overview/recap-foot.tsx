/** The recap foot under a finished trip's card (#443), as on the web: Share and Plan the next one, side by side. */
import { useState } from "react";
import { View } from "react-native";

import { PlusGlyph, ShareGlyph } from "../../system/glyphs";
import { Button } from "../../system/ui";
import { space } from "@/lib/theme";
import { LineRow } from "./line-row";
import { NextTripSheet } from "./next-trip-sheet";
import { ShareRecapSheet } from "./share-recap-sheet";

export function RecapFoot({ tripId, tripName, others }: {
  tripId: number;
  tripName: string;
  others: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState<"share" | "next" | null>(null);
  return (
    <View testID="recap-foot">
      <LineRow>
        <View style={{ flex: 1, flexDirection: "row", gap: space.sm }}>
          <View style={{ flexShrink: 0 }}>
            <Button variant="quiet" label="Share" onPress={() => setOpen("share")} icon={(ink) => <ShareGlyph color={ink} />} />
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="quiet" label="Plan the next one" onPress={() => setOpen("next")} icon={(ink) => <PlusGlyph color={ink} />} />
          </View>
        </View>
      </LineRow>
      <ShareRecapSheet open={open === "share"} onClose={() => setOpen(null)} tripId={tripId} tripName={tripName} />
      <NextTripSheet open={open === "next"} onClose={() => setOpen(null)} others={others} />
    </View>
  );
}
