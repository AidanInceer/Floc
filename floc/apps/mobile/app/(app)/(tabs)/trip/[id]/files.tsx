import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { AddFile } from "@/components/files/add-file";
import { ArchivedFiles } from "@/components/files/archived-files";
import { FileActions } from "@/components/files/file-actions";
import { FileFilters, type FileFilter } from "@/components/files/file-filter";
import { FileCard } from "@/components/files/file-card";
import { UploadGlyph } from "@/components/system/glyphs";
import { FileRow } from "@/components/files/file-row";
import { ForwardBookings } from "@/components/files/forward-bookings";
import { StorageMeter } from "@/components/files/storage-meter";
import { openFileNatively } from "@/components/files/open-file";
import { Sheet } from "@/components/system/sheet";
import { useTheme } from "@/components/system/theme";
import { Body, Button, Failed, Loading } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { countByCategory, emptyWords, filterVisible, inFilter, metaLine, splitByVisibility } from "@/lib/files/file-lines";
import { space } from "@/lib/theme";

export default function Files() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const ready = Number.isFinite(tripId);
  const { c } = useTheme();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [problem, setProblem] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [openFileId, setOpenFileId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FileFilter>("all");

  const files = useQuery(trpc.files.list.queryOptions({ tripId }, { enabled: ready }));
  const writable = useQuery(trpc.files.canUpload.queryOptions({ tripId }, { enabled: ready }));
  const usage = useQuery(trpc.files.usage.queryOptions({ tripId }, { enabled: ready }));

  const settled = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.files.list.queryKey({ tripId }) });
      queryClient.invalidateQueries({ queryKey: trpc.files.usage.queryKey({ tripId }) });
      void queryClient.invalidateQueries({ queryKey: trpc.files.archived.queryKey({ tripId }) });
    },
  };

  const upload = useMutation({
    ...trpc.files.upload.mutationOptions(),
    onSuccess: (refusal) => {
      setProblem(refusal);
      if (!refusal) settled.onSuccess();
    },
    onError: (error) => setProblem(error.message),
  });
  const remove = useMutation({ ...trpc.files.remove.mutationOptions(), ...settled });
  const refile = useMutation({ ...trpc.files.setCategory.mutationOptions(), ...settled });
  const rename = useMutation({ ...trpc.files.rename.mutationOptions(), ...settled });

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

  const counts = countByCategory(files.data);

  const shown = inFilter(files.data, filter);
  const open = files.data.find((file) => file.id === openFileId) ?? null;

  const { shared, yours } = splitByVisibility(shown);
  const rows = (list: typeof shown) =>
    list.map((file, i) => (
      <FileRow
        key={file.id}
        name={file.name}
        meta={metaLine(file, session?.user.id)}
        category={file.category}
        first={i === 0}
        onOpen={() => {
          void view(file);
        }}
        onActions={() => setOpenFileId(file.id)}
      />
    ));
  const words = emptyWords(filter);
  const canAdd = writable.data !== false;

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg }}
    >
      {filterVisible(counts, filter) ? (
        <FileFilters counts={counts} value={filter} onChange={setFilter} />
      ) : null}

      {!canAdd ? (
        <Body tone="ink-3">Files cannot be added yet — this Floc has nowhere to keep them.</Body>
      ) : null}

      {problem ? <Body tone="red">{problem}</Body> : null}

      <View style={{ gap: space.xl }}>
        <FileCard
          title="Shared"
          note="Everyone on the trip"
          empty={words.shared}
          count={shared.length}
          action={
            canAdd ? (
              <Button label="Upload" fit="small" icon={(ink) => <UploadGlyph color={ink} />} onPress={() => setAdding(true)} />
            ) : null
          }
        >
          {rows(shared)}
        </FileCard>
        <FileCard
          title="Yours"
          note="Only you can see these"
          empty={words.yours}
          count={yours.length}
        >
          {rows(yours)}
        </FileCard>
        <ArchivedFiles tripId={tripId} viewerId={session?.user.id} filter={filter} />
      </View>

      <ForwardBookings tripId={tripId} />

      {usage.data && canAdd ? <StorageMeter {...usage.data} /> : null}

      <Sheet open={adding} onClose={() => setAdding(false)}>
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
        onRename={async (name) => {
          if (!open) return;
          const refusal = await rename.mutateAsync({ tripId, fileId: open.id, name });
          if (refusal) throw new Error(refusal);
        }}
        onClose={() => setOpenFileId(null)}
      />
    </ScrollView>
  );
}
