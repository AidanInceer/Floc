/** Where you fly from and how you travel, for your own cost estimates (#574, ADR-057). Pro; a change on a trip stays on that trip. */
import { airportName } from "@floc/core/money/estimate/guide/home-airport";
import { estimateSummary } from "@floc/core/money/estimate/line-words";
import { CABIN_LABELS, CABINS, PACE_LABELS, PACES, STAY_LABELS, STAY_STYLES } from "@floc/core/money/estimate/style";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Drawer } from "@/components/system/drawer";
import { Body, Button, Field, Label, Segmented } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export function SettingsEstimate() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const settings = useQuery(trpc.estimate.settings.queryOptions());
  const [airport, setAirport] = useState<string | null>(null);
  const save = useMutation({
    ...trpc.estimate.setSettings.mutationOptions(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: trpc.estimate.settings.queryKey() }),
  });
  const data = settings.data;
  if (!data) return null;
  if (!data.pro) {
    return (
      <Drawer title="Cost estimate" summary="Floc Pro">
        <Body tone="ink-2">Your home airport and travel style shape your own cost estimate on each trip. A Floc Pro feature.</Body>
        <Button label="See Floc Pro" variant="quiet" fit="small" onPress={() => router.setParams({ pro: "1" })} />
      </Drawer>
    );
  }
  const code = airport ?? data.homeAirport ?? "";
  return (
    <Drawer title="Cost estimate" summary={estimateSummary(data.homeAirport, data.style)}>
      <View style={{ gap: space.sm }}>
        {!data.homeAirport && data.inferred ? <Body tone="ink-3">We think you fly from {airportName(data.inferred)} ({data.inferred}).</Body> : null}
        {!data.homeAirport && data.inferred ? <Button label="Confirm" variant="quiet" fit="small" busy={save.isPending} onPress={() => save.mutate({ homeAirport: data.inferred })} /> : null}
        <Field label="Home airport code" value={code} onChangeText={(t) => setAirport(t.toUpperCase())} autoCapitalize="characters" maxLength={3} autoCorrect={false} />
        <Button label="Save airport" variant="quiet" fit="small" busy={save.isPending} onPress={() => save.mutate({ homeAirport: code.trim() || null })} />
        {save.error ? <Body tone="red">{save.error.message}</Body> : null}
      </View>
      <Label>Cabin</Label>
      <Segmented soft options={CABINS.map((v) => ({ value: v, label: CABIN_LABELS[v] }))} value={data.style.cabin} onChange={(cabin) => save.mutate({ cabin })} />
      <Label>Stay</Label>
      <Segmented soft options={STAY_STYLES.map((v) => ({ value: v, label: STAY_LABELS[v] }))} value={data.style.stay} onChange={(stay) => save.mutate({ stay })} />
      <Label>Pace</Label>
      <Segmented soft options={PACES.map((v) => ({ value: v, label: PACE_LABELS[v] }))} value={data.style.pace} onChange={(pace) => save.mutate({ pace })} />
    </Drawer>
  );
}
