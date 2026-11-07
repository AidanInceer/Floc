import type { DocCategory } from "@floc/core/documents/documents";
import { filesByCategory } from "@floc/core/trip/overview/legs";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "../../system/theme";
import { FileChip } from "./file-chip";
import { FileUpload } from "./file-upload";
import { LineRow } from "./line-row";
import { fonts, size, space } from "@/lib/theme";

/** Files in one line, as the web's: what is there by kind, and one way to add. */
export function FilesLine({ tripId, files, failed, onRetry, onOpen }: {
  tripId: number;
  files: { category: DocCategory }[] | undefined;
  failed: boolean;
  onRetry: () => void;
  onOpen: () => void;
}) {
  const { c } = useTheme();
  const counts = filesByCategory(files ?? []);
  return (
    <LineRow>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Files"
        onPress={onOpen}
        style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm }}
      >
        <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>Files</Text>
        {failed && !files ? (
          <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>Files could not load</Text>
        ) : counts.length === 0 ? (
          <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>{files ? "No tickets or bookings yet." : "Loading"}</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
            {counts.map(({ category, count }) => (
              <FileChip key={category} category={category} count={count} onPress={onOpen} />
            ))}
          </View>
        )}
      </Pressable>
      {failed && !files ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Try again" onPress={onRetry} hitSlop={12}>
          <Text style={{ color: c.pen, fontFamily: fonts.sans, fontSize: size.small }}>Try again</Text>
        </Pressable>
      ) : null}
      <FileUpload tripId={tripId} title="Add a file" filedUnder="other" />
    </LineRow>
  );
}
