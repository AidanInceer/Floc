import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../../system/theme";
import { NudgeLine } from "../nudge/nudge-chips";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export function IdeasWaiting({ tripId }: { tripId: number }) {
  const { c } = useTheme();
  const nudges = useQuery(trpc.nudges.targets.queryOptions({ tripId }));
  const unvoted = nudges.data?.ideas ?? [];
  if (unvoted.length === 0) return null;
  return (
    <View style={{ paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <NudgeLine tripId={tripId} task="ideas" people={unvoted} />
    </View>
  );
}
