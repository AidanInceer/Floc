/**
 * Bookings (#559) — the phone's half of `/bookings`: forwarded or uploaded files that wait for you to
 * choose their trip. Yours alone; a file reaches a trip only as one of your private files there.
 */
import { bookingSummary } from "@floc/core/documents/booking/booking-details";
import {
  bookingForwardWords, bookingInboxLeftWords, bookingInboxNote, bookingsEmptyWords, bookingsNoStorageWords,
} from "@floc/core/documents/booking/booking-inbox";
import { formatBytes } from "@floc/core/documents/documents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { ScrollView, Share, View } from "react-native";

import { pickFile } from "@/components/files/file-picker";
import { StorageMeter } from "@/components/files/storage-meter";
import { MoreGlyph, ShareGlyph } from "@/components/system/glyphs";
import { Sheet } from "@/components/system/sheet";
import { Body, Button, Card, ChoiceSheet, Divider, Empty, Failed, IconButton, Label, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export default function Bookings() {
  const queryClient = useQueryClient();
  const area = useQuery(trpc.bookings.area.queryOptions());
  const [placing, setPlacing] = useState<number | null>(null);
  const [more, setMore] = useState<number | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);

  const settled = (answer: string | null | void) => {
    setRefusal(answer ?? null);
    void queryClient.invalidateQueries({ queryKey: trpc.bookings.pathKey() });
    void queryClient.invalidateQueries({ queryKey: trpc.files.pathKey() });
  };
  const place = useMutation({ ...trpc.bookings.place.mutationOptions(), onSuccess: settled });
  const remove = useMutation({
    ...trpc.bookings.remove.mutationOptions(),
    onSuccess: () => {
      setMore(null);
      settled(null);
    },
  });
  const upload = useMutation({ ...trpc.bookings.upload.mutationOptions(), onSuccess: settled });

  if (area.isPending) return <Loading />;
  if (area.isError) return <Failed onRetry={() => area.refetch()} />;

  const { files, trips, usage, address, canUpload } = area.data;
  if (!canUpload) return <Empty>{bookingsNoStorageWords}</Empty>;

  const add = async () => {
    try {
      const file = await pickFile();
      if (file) upload.mutate(file);
    } catch {
      setRefusal("That file could not be read");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: space.sm }}>
        {address ? (
          <Button
            label="Forward bookings"
            variant="quiet"
            fit="small"
            icon={(ink) => <ShareGlyph color={ink} />}
            onPress={() => void Share.share({ message: address })}
          />
        ) : null}
        <Button label="Upload" fit="small" busy={upload.isPending} onPress={() => void add()} />
      </View>
      {address ? <Label>{bookingForwardWords}</Label> : null}

      {refusal ? <Body tone="red">{refusal}</Body> : null}

      {files.length === 0 ? (
        <Empty>{bookingsEmptyWords}</Empty>
      ) : (
        <Card style={{ gap: space.md }}>
          {files.map((file, index) => (
            <Fragment key={file.id}>
              {index > 0 ? <Divider /> : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <View style={{ flex: 1, minWidth: 0, gap: space.sm }}>
                  <View style={{ gap: 2 }}>
                    <Body bold>{file.name}</Body>
                    <Label>
                      {[file.booking ? bookingSummary(file.booking) : null, formatBytes(file.sizeBytes), bookingInboxLeftWords(file.daysLeft)]
                        .filter(Boolean)
                        .join(" · ")}
                    </Label>
                  </View>
                  {trips.length === 0 ? (
                    <Label>No trip to put it in yet</Label>
                  ) : (
                    <View style={{ alignItems: "flex-start" }}>
                      {/* Why the sheet opens even for one trip: the press that moves a file is on the trip's own name, as on the web. */}
                      <Button
                        label="Add to trip"
                        variant="quiet"
                        fit="small"
                        busy={place.isPending && place.variables?.fileId === file.id}
                        onPress={() => setPlacing(file.id)}
                      />
                    </View>
                  )}
                </View>
                <IconButton label={`More for ${file.name}`} onPress={() => setMore(file.id)}>
                  {(color) => <MoreGlyph color={color} />}
                </IconButton>
              </View>
            </Fragment>
          ))}
        </Card>
      )}

      <Label>{bookingInboxNote}</Label>
      <StorageMeter {...usage} />

      <ChoiceSheet
        title="Which trip is this for?"
        open={placing !== null}
        onClose={() => setPlacing(null)}
        options={trips.map((trip) => ({ value: String(trip.id), label: trip.name }))}
        value=""
        onChange={(tripId) => {
          if (placing !== null) place.mutate({ fileId: placing, tripId: Number(tripId) });
        }}
      />
      <Sheet open={more !== null} onClose={() => setMore(null)}>
        <View style={{ paddingHorizontal: space.lg }}>
          <Button
            label="Remove"
            variant="quiet"
            busy={remove.isPending}
            onPress={() => {
              if (more !== null) remove.mutate({ fileId: more });
            }}
          />
        </View>
      </Sheet>
    </ScrollView>
  );
}
