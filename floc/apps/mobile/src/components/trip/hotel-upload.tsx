import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";

import { AddFile } from "../files/add-file";
import { Sheet } from "../system/sheet";
import { Body, Button, SectionTitle } from "../system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

/** A stop's hotel booking, added from its row on Dates: the usual file sheet, filed as Hotel on the stop's first day. */
export function HotelUpload({ tripId, dayId, place }: { tripId: number; dayId: number; place: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const writable = useQuery(trpc.files.canUpload.queryOptions({ tripId }));
  const upload = useMutation({
    ...trpc.files.upload.mutationOptions(),
    onSuccess: (refusal) => {
      setProblem(refusal);
      if (refusal) return;
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: trpc.files.list.queryKey({ tripId }) });
    },
    onError: (error) => setProblem(error.message),
  });

  if (writable.data === false) return null;
  return (
    <>
      <Button label="Add a booking" variant="quiet" onPress={() => setOpen(true)} />
      <Sheet open={open} onClose={() => setOpen(false)}>
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
            onCancel={() => setOpen(false)}
          />
          {problem ? <Body tone="red">{problem}</Body> : null}
        </View>
      </Sheet>
    </>
  );
}
