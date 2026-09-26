/**
 * The files on one event, inside its modal (ticket 325). The boarding pass
 * sits on the ferry, not in a folder with eleven others.
 *
 * IT READS ITS OWN LIST, like `overnight-line`. The Days screen already holds
 * a day, a form and a thread; handing it eight more props and three mutations
 * to pass through would make the screen the wiring loom for a section it does
 * not otherwise know about.
 *
 * TWO WAYS IN, BECAUSE THERE ARE TWO SITUATIONS. The ticket is already on the
 * trip, or it is still in your downloads. Linking one that is already up costs
 * no upload, so it is offered first.
 *
 * "JUST YOU" MEANS ONLY YOU, never "restricted" — the API never sends somebody
 * else's private file, so a row that arrives here is the viewer's to see.
 *
 * DETACHING IS NOT REMOVING, so it does not ask twice and it does not take a
 * row. The file stays on the trip's Files screen; only the tie to this event
 * goes — which is worth a cross at the end of the line, not a button under it
 * (#325 feedback).
 */
import { DOC_CATEGORY_LABELS } from "@floc/core/documents/documents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AddFile } from "./add-file";
import { useTheme } from "../system/theme";
import { Sheet } from "../system/sheet";
import { CrossGlyph } from "../system/glyphs";
import { Body, Button, Failed, Figure, IconButton, Label, Loading, Pill } from "../system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export function EventFiles({ tripId, dayEventId }: { tripId: number; dayEventId: number }) {
  const { c } = useTheme();
  const queryClient = useQueryClient();

  const [problem, setProblem] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [linking, setLinking] = useState(false);

  const files = useQuery(trpc.files.list.queryOptions({ tripId }));
  const writable = useQuery(trpc.files.canUpload.queryOptions({ tripId }));

  const again = () =>
    queryClient.invalidateQueries({ queryKey: trpc.files.list.queryKey({ tripId }) });
  const settled = {
    onSuccess: again,
    onError: (error: { message: string }) => setProblem(error.message),
  };

  const upload = useMutation({
    ...trpc.files.upload.mutationOptions(),
    onSuccess: (refusal) => {
      // A refusal is a sentence, not a throw — a full trip and a 20 MB video
      // are ordinary mistakes (the validation convention).
      setProblem(refusal);
      if (!refusal) again();
    },
    onError: settled.onError,
  });
  const attach = useMutation({ ...trpc.files.attach.mutationOptions(), ...settled });
  const detach = useMutation({ ...trpc.files.detach.mutationOptions(), ...settled });

  const busy = upload.isPending || attach.isPending || detach.isPending;

  if (files.isPending) return <Loading />;
  if (files.isError) return <Failed onRetry={() => files.refetch()} />;

  const here = files.data.filter((file) => file.dayEventId === dayEventId);
  const loose = files.data.filter((file) => file.dayEventId === null);

  return (
    <View style={{ gap: space.sm }}>
      <Label>Files</Label>

      {here.length === 0 ? (
        <Body tone="ink-3">Nothing attached yet — tickets and bookings for this go here.</Body>
      ) : (
        here.map((file) => (
          <View
            key={file.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.sm,
              paddingVertical: space.sm,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: c.rule,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Body bold>{file.name}</Body>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Figure tone="ink-2">{DOC_CATEGORY_LABELS[file.category]}</Figure>
                {file.ownerId ? <Pill word="Just you" tone="pastel-blue" /> : null}
              </View>
            </View>
            <IconButton
              label={`Detach ${file.name}`}
              disabled={busy}
              onPress={() => detach.mutate({ tripId, fileId: file.id })}
            >
              {(color) => <CrossGlyph color={color} />}
            </IconButton>
          </View>
        ))
      )}

      {/* Two ways in, side by side — stacked they read as a wall of two
          buttons saying nearly the same thing. */}
      {!adding ? (
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {loose.length > 0 ? (
            <View style={{ flex: 1 }}>
              <Button label="Link a file" variant="quiet" onPress={() => setLinking(true)} />
            </View>
          ) : null}
          {writable.data !== false ? (
            <View style={{ flex: 1 }}>
              <Button label="Add a file" variant="quiet" onPress={() => setAdding(true)} />
            </View>
          ) : null}
        </View>
      ) : null}

      {writable.data === false ? (
        <Body tone="ink-3">Files cannot be added yet — this Floc has nowhere to keep them.</Body>
      ) : adding ? (
        <AddFile
          filedUnder="tickets"
          busy={busy}
          onPicked={(picked) => {
            setProblem(null);
            upload.mutate({ tripId, ...picked, dayEventId });
            setAdding(false);
          }}
          onUnreadable={() => setProblem("That file could not be read.")}
          onCancel={() => setAdding(false)}
        />
      ) : null}

      {problem ? <Body tone="red">{problem}</Body> : null}

      <Sheet open={linking} onClose={() => setLinking(false)}>
        <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
          <Label>Already on this trip</Label>
          {loose.map((file) => (
            <Button
              key={file.id}
              label={file.name}
              variant="quiet"
              onPress={() => {
                attach.mutate({ tripId, fileId: file.id, dayEventId });
                setLinking(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </View>
  );
}
