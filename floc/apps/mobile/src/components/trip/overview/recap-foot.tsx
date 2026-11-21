import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { PlusGlyph, ShareGlyph } from "../../system/glyphs";
import { Button } from "../../system/ui";
import { space } from "@/lib/theme";
import { LineRow } from "./line-row";
import { ShareRecapSheet } from "./share-recap-sheet";

export function RecapFoot({ tripId, tripName, others }: {
  tripId: number;
  tripName: string;
  others: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"share" | null>(null);
  return (
    <View testID="recap-foot">
      <LineRow>
        <View style={{ flex: 1, flexDirection: "row", gap: space.sm }}>
          <View style={{ flexShrink: 0 }}>
            <Button variant="quiet" label="Share" onPress={() => setOpen("share")} icon={(ink) => <ShareGlyph color={ink} />} />
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="quiet" label="Plan the next one" onPress={() => router.push({ pathname: "/(app)/new-trip", params: { along: others.map((p) => p.id).join(",") } } as never)} icon={(ink) => <PlusGlyph color={ink} />} />
          </View>
        </View>
      </LineRow>
      <ShareRecapSheet open={open === "share"} onClose={() => setOpen(null)} tripId={tripId} tripName={tripName} />
    </View>
  );
}
