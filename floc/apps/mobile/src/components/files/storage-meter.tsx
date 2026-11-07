/** The web's `StorageMeter`: a quiet footer line over a full-width bar (#285). The words carry it; the bar only shows the share. */
import { formatBytes } from "@floc/core/documents/documents";
import { Text, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function StorageMeter({ usedBytes, quotaBytes }: { usedBytes: number; quotaBytes: number }) {
  const { c } = useTheme();
  const share = Math.min(100, (usedBytes / quotaBytes) * 100);
  return (
    <View style={{ gap: space.xs }}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Space used"
        accessibilityValue={{ min: 0, max: quotaBytes, now: usedBytes }}
        style={{ height: 4, borderRadius: radius.pill, backgroundColor: c.rule, overflow: "hidden" }}
      >
        <View style={{ width: `${share}%`, height: "100%", backgroundColor: c.pen }} />
      </View>
      <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small }}>
        {formatBytes(usedBytes)} of {formatBytes(quotaBytes)} used
      </Text>
    </View>
  );
}
