import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";

import { AddFile } from "../files/add-file";
import { Sheet } from "../system/sheet";
import { Body, SectionTitle } from "../system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export function useCanUpload(tripId: number) {
  return useQuery(trpc.files.canUpload.queryOptions({ tripId })).data !== false;
}

/** A stop's hotel booking: the usual file sheet, filed as Hotel on the stop's first day. */
export function HotelUpload({ tripId, dayId, place, open, onClose }: { tripId: number; dayId: number; place: string; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState<string | null>(null);
  const upload = useMutation({
    ...trpc.files.upload.mutationOptions(),
    onSuccess: (refusal) => {
      setProblem(refusal);
      if (refusal) return;
      onClose();
      void queryClient.invalidateQueries({ queryKey: trpc.files.list.queryKey({ tripId }) });
    },
    onError: (error) => setProblem(error.message),
  });

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
        <SectionTitle>{`Add a booking for ${place}`}</SectionTitle>
        <AddFile
          filedUnder="hotel"
          busy={upload.isPending}
          onPicked={(picked) => {
            setProblem(null);
            upload.mutate({ tripId, ...picked, dayId });
          }}
          onUnreadable={() => setProblem("That file could not be read.")}
          onCancel={onClose}
        />
        {problem ? <Body tone="red">{problem}</Body> : null}
      </View>
    </Sheet>
  );
}
