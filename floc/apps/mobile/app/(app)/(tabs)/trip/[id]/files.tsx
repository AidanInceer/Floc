/**
 * The trip's files (tickets 239, 296) — the phone's half of `/trip/[id]/files`.
 *
 * OVERVIEW SHOWS THE TOP OF THE PILE; THIS IS THE PILE. Overview's block was
 * read-only and said how many more there were, which is the right thing for a
 * summary and the wrong thing for the only view there is.
 *
 * SHARED OR PRIVATE IS ASKED ONCE, ON THE LINE THE FILE GOES UP WITH. It is a
 * question with a right default — the trip's pile — so it rides the line it
 * belongs to rather than taking a labelled row of its own.
 *
 * WITHOUT A VOLUME THERE IS NO UPLOAD DRAWN (rule 11). Not a dead button with a
 * sentence under it: the control is absent and the reason is said once.
 *
 * REMOVING IS THE UPLOADER'S ONLY. Deliberately stricter than packing, where
 * any member may drop a shared line — a booking somebody else is relying on is
 * not yours to bin.
 */
import { DOC_CATEGORIES, DOC_CATEGORY_LABELS, type DocCategory } from "@floc/core/documents/documents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { pickFile } from "@/components/files/file-picker";
import { useTheme } from "@/components/system/theme";
import {
  Body,
  Button,
  Card,
  Dropdown,
  Empty,
  Failed,
  Figure,
  Label,
  Loading,
  Pill,
  Toggle,
} from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { space } from "@/lib/theme";

const CATEGORY_OPTIONS = DOC_CATEGORIES.map((value) => ({
  value,
  label: DOC_CATEGORY_LABELS[value],
}));

export default function Files() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const ready = Number.isFinite(tripId);
  const { c } = useTheme();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [category, setCategory] = useState<DocCategory>("other");
  const [shared, setShared] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

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

  const choose = async () => {
    setProblem(null);
    setPicking(true);
    try {
      const picked = await pickFile();
      if (picked) upload.mutate({ tripId, ...picked, category, shared });
    } catch {
      setProblem("That file could not be read.");
    } finally {
      setPicking(false);
    }
  };

  if (files.isPending) return <Loading />;
  if (files.isError) return <Failed onRetry={() => files.refetch()} />;

  const mine = session?.user.id;

  return (
    <ScrollView
      style={{ backgroundColor: c.paper }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg }}
    >
      {writable.data === false ? (
        <Body tone="ink-3">
          Files cannot be added yet — this Floc has nowhere to keep them.
        </Body>
      ) : (
        <View style={{ gap: space.sm }}>
          <Label>Add a file</Label>
          <Dropdown
            label="Filed under"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={setCategory}
          />
          <Toggle
            label="Everyone on the trip"
            hint="Off keeps it in your own pile."
            value={shared}
            onChange={setShared}
          />
          <Button
            label="Choose a file"
            busy={picking || upload.isPending}
            onPress={() => {
              void choose();
            }}
          />
          {problem ? <Body tone="red">{problem}</Body> : null}
          <Body tone="ink-3">PDFs and pictures, up to 10 MB.</Body>
        </View>
      )}

      <View style={{ gap: space.sm }}>
        <Label>On this trip</Label>
        {files.data.length === 0 ? (
          <Empty>No files yet.</Empty>
        ) : (
          files.data.map((file) => (
            <Card key={file.id}>
              <Body bold>{file.name}</Body>
              <Figure tone="ink-2">
                {file.uploaderName} · {DOC_CATEGORY_LABELS[file.category]}
              </Figure>
              {/* "Private" here means only you — the API never sends somebody
                  else's, so it cannot mean "restricted". */}
              {file.ownerId ? <Pill word="Private" tone="peri" /> : null}
              <Dropdown
                label="Filed under"
                options={CATEGORY_OPTIONS}
                value={file.category}
                onChange={(next) =>
                  refile.mutate({ tripId, fileId: file.id, category: next })
                }
              />
              {file.uploadedBy === mine ? (
                <Button
                  label="Remove"
                  variant="danger"
                  busy={remove.isPending}
                  onPress={() => remove.mutate({ tripId, fileId: file.id })}
                />
              ) : (
                <Body tone="ink-3">Only {file.uploaderName} can remove this.</Body>
              )}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
