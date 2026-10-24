// Why: only while the trip runs (#329), the same rule as the web's Today block.
import { formatDate } from "@floc/core/dates/dates";
import type { TodayPlan } from "@floc/core/trip/route/today-plan";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/components/system/theme";
import { Body, Card, Label } from "@/components/system/ui";
import { fonts, size, space } from "@/lib/theme";

type TodayEvent = { id: number; title: string | null; time: string | null; endTime: string | null; placeName: string | null };
type TodayFile = { id: number; name: string };

export function TodayCard({
  plan,
  onOpenDay,
}: {
  plan: TodayPlan<TodayEvent, TodayFile>;
  onOpenDay: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <Label>Today · {formatDate(plan.date)}</Label>
      <Card>
        {plan.events.length === 0 ? <Body tone="ink-2">Nothing planned today.</Body> : null}
        {plan.events.map((e) => (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            onPress={onOpenDay}
            style={{ flexDirection: "row", gap: space.md, alignItems: "baseline" }}
          >
            <Text style={{ width: 92, color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small }}>
              {e.time ? (e.endTime ? `${e.time}–${e.endTime}` : e.time) : "All day"}
            </Text>
            <View style={{ flex: 1 }}>
              <Body>{e.title ?? "Untitled"}</Body>
              {e.placeName ? <Body tone="ink-3">{e.placeName}</Body> : null}
            </View>
          </Pressable>
        ))}
        {plan.files.length > 0 ? <Body tone="ink-3">Files today: {plan.files.map((f) => f.name).join(", ")}</Body> : null}
      </Card>
    </View>
  );
}
