/**
 * The trip's files (tickets 239, 296) — the phone's half of `/trip/[id]/files`.
 *
 * ONE LINE PER FILE, AND A FILTER, the way the browser draws it (#325
 * feedback). A card per file put a name, a dropdown and a button on every row,
 * so three files filled the screen.
 *
 * ADDING IS BEHIND A PRESS. The form asks two questions and picks a file; open
 * on the screen it was the first thing you met and the pile was below it.
 *
 * WITHOUT A VOLUME THERE IS NO UPLOAD DRAWN (rule 11). Not a dead button with a
 * sentence under it: the control is absent and the reason is said once.
 *
 * REMOVING A SHARED FILE IS ANY MEMBER'S, the way a shared packing line is. A
 * private file is never handed to anybody but its owner, so it is not
 * addressable by the rest.
 */
import { DOC_CATEGORIES, type DocCategory } from "@floc/core/documents/documents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { AddFile } from "@/components/files/add-file";
import { FileActions } from "@/components/files/file-actions";
import { FileFilters, type FileFilter } from "@/components/files/file-filter";
import { FileRow } from "@/components/files/file-row";
import { openFileNatively } from "@/components/files/open-file";
import { Sheet } from "@/components/system/sheet";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Empty, Failed, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export default function Files() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const ready = Number.isFinite(tripId);
  const { c } = useTheme();
  const queryClient = useQueryClient();

  const [problem, setProblem] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [openFileId, setOpenFileId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FileFilter>("all");

  const files = useQuery(trpc.files.list.queryOptions({ tripId }, { enabled: ready }));
  const writable = useQuery(trpc.files.canUpload.queryOptions({ tripId }, { enabled: ready }));

  const settled = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.files.list.queryKey({ tripId }) });
    },
  };

  const upload = useMutation({
    ...trpc.files.upload.mutationOptions(),
    onSuccess: (refusal) => {
      // A refusal is a sentence, not a throw — a full trip and a 20 MB video
      // are ordinary mistakes (the validation convention).
      setProblem(refusal);
      if (!refusal) settled.onSuccess();
    },
    onError: (error) => setProblem(error.message),
  });
  const remove = useMutation({ ...trpc.files.remove.mutationOptions(), ...settled });
  const refile = useMutation({ ...trpc.files.setCategory.mutationOptions(), ...settled });

  // The address is asked for at the moment of the tap, not held on the row:
  // it is signed and it expires, so a list minted an hour ago opens nothing.
  // It then goes to the phone's own reader, not a browser — see `open-file`.
  const view = async (file: { id: number; name: string; mimeType: string }) => {
    try {
      const url = await queryClient.fetchQuery(
        trpc.files.viewUrl.queryOptions({ tripId, fileId: file.id }),
      );
      await openFileNatively(url, file.name, file.mimeType);
    } catch {
      setProblem("That file could not be opened.");
    }
  };

  if (files.isPending) return <Loading />;
  if (files.isError) return <Failed onRetry={() => files.refetch()} />;

  const counts = Object.fromEntries(
    DOC_CATEGORIES.map((category) => [
      category,
      files.data.filter((file) => file.category === category).length,
    ]),
  ) as Record<DocCategory, number>;

  const shown = files.data.filter((file) => filter === "all" || file.category === filter);
  const open = files.data.find((file) => file.id === openFileId) ?? null;

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <FileFilters counts={counts} value={filter} onChange={setFilter} />
        </View>
        {writable.data !== false ? (
          <Button label="Upload" fit="small" onPress={() => setAdding(true)} />
        ) : null}
      </View>

      {writable.data === false ? (
        <Body tone="ink-3">Files cannot be added yet — this Floc has nowhere to keep them.</Body>
      ) : null}

      {problem ? <Body tone="red">{problem}</Body> : null}

      <View>
        {shown.length === 0 ? (
          <Empty>
            {filter === "all" ? "No files yet." : "Nothing is filed here."}
          </Empty>
        ) : (
          shown.map((file) => (
            <FileRow
              key={file.id}
              name={file.name}
              uploaderName={file.uploaderName}
              category={file.category}
              own={file.ownerId !== null}
              onOpen={() => {
                void view(file);
              }}
              onActions={() => setOpenFileId(file.id)}
            />
          ))
        )}
      </View>

      <Sheet open={adding} onClose={() => setAdding(false)}>
        {/* No heading over it: the dropdown, the switch and "Choose a file"
            say what this is, and a label above a label says nothing (#325
            feedback). */}
        <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
          <AddFile
            filedUnder="other"
            busy={upload.isPending}
            onPicked={(picked) => {
              setProblem(null);
              upload.mutate({ tripId, ...picked });
              setAdding(false);
            }}
            onUnreadable={() => setProblem("That file could not be read.")}
            onCancel={() => setAdding(false)}
          />
        </View>
      </Sheet>

      <FileActions
        name={open?.name ?? null}
        category={open?.category ?? "other"}
        busy={remove.isPending}
        onRefile={(category) => {
          if (open) refile.mutate({ tripId, fileId: open.id, category });
        }}
        onRemove={() => {
          if (open) remove.mutate({ tripId, fileId: open.id });
          setOpenFileId(null);
        }}
        onClose={() => setOpenFileId(null)}
      />
    </ScrollView>
  );
}
