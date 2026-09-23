/** The web's `StorageMeter`, drawn natively (#285). The words carry it; the bar only shows the share. */
import { formatBytes } from "@floc/core/documents/documents";
import { View } from "react-native";

import { useTheme } from "../system/theme";
import { Figure } from "../system/ui";
import { radius, space } from "@/lib/theme";

export function StorageMeter({ usedBytes, quotaBytes }: { usedBytes: number; quotaBytes: number }) {
  const { c } = useTheme();
  const share = Math.min(100, (usedBytes / quotaBytes) * 100);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: space.sm }}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Space used"
        accessibilityValue={{ min: 0, max: quotaBytes, now: usedBytes }}
        style={{ width: 96, height: 4, borderRadius: radius.pill, backgroundColor: c.rule, overflow: "hidden" }}
      >
        <View style={{ width: `${share}%`, height: "100%", backgroundColor: c.pen }} />
      </View>
      <Figure tone="ink-2">
        {formatBytes(usedBytes)} of {formatBytes(quotaBytes)} used
      </Figure>
    </View>
  );
}
