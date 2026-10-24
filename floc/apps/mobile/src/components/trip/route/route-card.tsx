/**
 * The member's own switch (#329, ADR-026): off until they turn it on, for this trip only, and only while
 * it runs. Refused permission says why in words and changes nothing else (rule 11).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Alert, Linking } from "react-native";

import { QuietAction } from "@/components/system/text-controls";
import { Body, Card, Toggle } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { recordingTrip, startRoute, stopRoute, type StartRefusal } from "@/lib/route/route-task";

const REFUSED: Record<StartRefusal, string> = {
  foreground: "Floc can't see where you are. Allow location for Floc in your phone's settings.",
  background: "To record while the phone is in your pocket, set Floc's location to \"Allow all the time\".",
};

export function RouteCard({ tripId, endDate, hasRoute }: { tripId: number; endDate: string; hasRoute: boolean }) {
  const queryClient = useQueryClient();
  const server = useQuery(trpc.route.on.queryOptions({ tripId }));
  const [here, setHere] = useState<boolean | null>(null);
  const [refused, setRefused] = useState<StartRefusal | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void recordingTrip().then((t) => setHere(t === tripId));
  }, [tripId]);

  const setOn = useMutation({
    ...trpc.route.setOn.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.route.on.queryKey({ tripId }) }),
  });
  const remove = useMutation({
    ...trpc.route.deleteMine.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.route.group.pathKey() }),
  });

  const on = Boolean(server.data) && here === true;

  const toggle = async (next: boolean) => {
    setBusy(true);
    setRefused(null);
    try {
      if (next) {
        const refusal = await startRoute({ tripId, endDate });
        if (refusal) return setRefused(refusal);
      } else {
        await stopRoute();
      }
      await setOn.mutateAsync({ tripId, on: next });
      setHere(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Toggle
        label="Record my route"
        hint="Where you are every 5 minutes, seen by the group. Stops by itself after the trip."
        value={on}
        onChange={(next) => void toggle(next)}
        disabled={busy || here === null}
      />
      {refused ? (
        <>
          <Body tone="red">{REFUSED[refused]}</Body>
          <QuietAction label="Open settings" onPress={() => void Linking.openSettings()} />
        </>
      ) : null}
      {hasRoute ? (
        <QuietAction
          label="Delete my route"
          disabled={remove.isPending}
          onPress={() =>
            Alert.alert("Delete your route?", "It goes for everyone on this trip, for good.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete my route", style: "destructive", onPress: () => remove.mutate({ tripId }) },
            ])
          }
        />
      ) : null}
    </Card>
  );
}
