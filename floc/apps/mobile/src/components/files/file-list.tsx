/**
 * The trip's files, newest first (ticket 296).
 *
 * A pile you add to, not a checklist — so Overview shows the top of it and
 * says how much more there is, rather than scrolling the lot.
 *
 * A private file is never somebody else's: the API filters on the viewer, so
 * anything that arrives here is already the viewer's to see. The `Private`
 * pill therefore means "only you", not "restricted".
 */
import { DOC_CATEGORY_LABELS } from "@floc/core/documents/documents";
import type { DocCategory } from "@floc/core/documents/documents";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../system/theme";
import { Body, Figure, Pill } from "../system/ui";
import { space } from "@/lib/theme";

export type TripFileRow = {
  id: number;
  name: string;
  sizeBytes: number;
  category: DocCategory;
  ownerId: string | null;
};

/** Binary units, one decimal, and never below a kilobyte — a size is a rough sense of weight, not an audit. */
function readableSize(bytes: number): string {
  const units = ["kB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

export function FileList({ files, showing }: { files: TripFileRow[]; showing: number }) {
  const { c } = useTheme();
  const shown = files.slice(0, showing);
  const rest = files.length - shown.length;

  return (
    <View style={{ gap: space.sm }}>
      {shown.map((file) => (
        <View
          key={file.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.md,
            paddingVertical: space.sm,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: c.rule,
          }}
        >
          <View style={{ flex: 1 }}>
            <Body>{file.name}</Body>
          </View>
          <Figure tone="ink-2">
            {DOC_CATEGORY_LABELS[file.category]} · {readableSize(file.sizeBytes)}
          </Figure>
          {file.ownerId ? <Pill word="Private" tone="peri" /> : null}
        </View>
      ))}
      {rest > 0 ? (
        <Figure tone="ink-2">
          {rest} more {rest === 1 ? "file" : "files"}
        </Figure>
      ) : null}
    </View>
  );
}
