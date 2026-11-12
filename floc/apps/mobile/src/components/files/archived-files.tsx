/** Removed files, waiting out their week (ADR-048), as on the web: a line each and Restore, the only verb. Absent while empty. */
import { fileArchiveNote } from "@floc/core/documents/archive";
import { DOC_CATEGORY_TONES, type DocCategory } from "@floc/core/documents/documents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FileCard } from "./file-card";
import { FileGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Body, Button } from "../system/ui";
import { trpc } from "@/lib/api";
import { archivedMetaLines, inFilter } from "@/lib/files/file-lines";
import { fonts, radius, size, space } from "@/lib/theme";

export function ArchivedFiles({
  tripId,
  viewerId,
  filter,
}: {
  tripId: number;
  viewerId: string | undefined;
  filter: DocCategory | "all";
}) {
  const { c } = useTheme();
  const queryClient = useQueryClient();
  // Why here and not at the top of the screen: Restore sits at the foot of the scroll, and its refusal must be read beside it.
  const [problem, setProblem] = useState<string | null>(null);
  const archived = useQuery(trpc.files.archived.queryOptions({ tripId }));
  const restore = useMutation({
    ...trpc.files.restore.mutationOptions(),
    onSuccess: (refusal) => {
      setProblem(refusal);
      if (refusal) return;
      for (const key of [trpc.files.archived, trpc.files.list, trpc.files.usage]) {
        void queryClient.invalidateQueries({ queryKey: key.queryKey({ tripId }) });
      }
    },
    onError: (error) => setProblem(error.message),
  });

  const row = { paddingHorizontal: space.md, paddingVertical: space.md, gap: space.sm };
  if (archived.isError) {
    return (
      <FileCard title="Archived" note={fileArchiveNote} empty="" count={1}>
        <View style={[row, { flexDirection: "row", alignItems: "center" }]}>
          <View style={{ flex: 1 }}>
            <Body tone="ink-2">The archive didn&apos;t load.</Body>
          </View>
          <View>
            <Button label="Try again" variant="quiet" fit="small" onPress={() => void archived.refetch()} />
          </View>
        </View>
      </FileCard>
    );
  }

  const files = inFilter(archived.data ?? [], filter);
  if (files.length === 0) return null;
  const now = new Date();

  return (
    <FileCard title="Archived" note={fileArchiveNote} empty="" count={files.length}>
      {files.map((file, i) => {
        const tone = DOC_CATEGORY_TONES[file.category];
        return (
          <View
            key={file.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.md,
              minHeight: 60,
              paddingVertical: space.md,
              paddingHorizontal: space.md,
              borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: c.rule,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.sm,
                backgroundColor: tone ? c[`pastel-${tone}`] : c["sheet-3"],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileGlyph color={tone ? c[`pastel-${tone}-ink`] : c["ink-2"]} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>
                {file.name}
              </Text>
              {archivedMetaLines(file, viewerId, now).map((line) => (
                <Text key={line} numberOfLines={1} style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small }}>
                  {line}
                </Text>
              ))}
            </View>
            <View>
              <Button
                label="Restore"
                variant="quiet"
                fit="small"
                busy={restore.isPending && restore.variables?.fileId === file.id}
                onPress={() => restore.mutate({ tripId, fileId: file.id })}
              />
            </View>
          </View>
        );
      })}
      {problem ? (
        <View style={[row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }]}>
          <Body tone="red">{problem}</Body>
        </View>
      ) : null}
    </FileCard>
  );
}
