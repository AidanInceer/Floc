import type { DocCategory } from "@floc/core/documents/documents";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { AddFile } from "../../files/add-file";
import { Sheet } from "../../system/sheet";
import { useTheme } from "../../system/theme";
import { Body, SectionTitle } from "../../system/ui";
import { UploadGlyph } from "@/components/system/glyphs";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

/** A borderless ghost upload button that opens the usual file sheet. A `dayId` files the booking on that stop's first day; none files it on the whole trip. */
export function FileUpload({
  tripId,
  dayId,
  title,
  filedUnder,
}: {
  tripId: number;
  dayId?: number;
  title: string;
  filedUnder: DocCategory;
}) {
  const { c } = useTheme();
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        hitSlop={10}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          width: 28,
          height: 28,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <UploadGlyph color={c["ink-2"]} />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
          <SectionTitle>{title}</SectionTitle>
          <AddFile
            filedUnder={filedUnder}
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
