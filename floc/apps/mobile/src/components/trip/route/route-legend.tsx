// Why: colour alone does not say whose route it is, so each is named and its age said in words (#329).
import type { GroupRoute } from "@floc/api/port";
import type { WhoTone } from "@floc/core/people/who";
import { positionAge } from "@floc/core/trip/route/route-track";
import { View } from "react-native";

import { useTheme } from "@/components/system/theme";
import { Body } from "@/components/system/ui";
import { space } from "@/lib/theme";

export function RouteLegend({ routes, viewerId, now }: { routes: GroupRoute[]; viewerId: string | undefined; now: number }) {
  const { c } = useTheme();
  if (routes.length === 0) return null;
  return (
    <View style={{ gap: space.xs }}>
      {routes.map((r) => (
        <View key={r.userId} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c[`${r.tone as WhoTone}-ink`] }} />
          <Body>{r.userId === viewerId ? "You" : r.name}</Body>
          {r.live ? <Body tone="ink-3">{positionAge(r.live.recordedAt, now)}</Body> : null}
        </View>
      ))}
    </View>
  );
}
