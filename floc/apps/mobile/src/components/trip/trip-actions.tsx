import { useState } from "react";
import { View } from "react-native";

import { Body, Button, Divider } from "../system/ui";
import { space } from "@/lib/theme";

type Pending = "archive" | "delete" | null;

export function TripActions({
  isAdmin,
  archived,
  busy,
  onArchive,
  onDelete,
}: {
  isAdmin: boolean;
  archived: boolean;
  busy: boolean;
  onArchive: (next: boolean) => void;
  onDelete: () => void;
}) {
  const [asking, setAsking] = useState<Pending>(null);

  return (
    <View style={{ gap: space.sm }}>
      <Divider />
      {isAdmin ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label={archived ? "Restore trip" : asking === "archive" ? "Sure?" : "Archive trip"}
              variant="quiet"
              busy={busy}
              onPress={() => {
                if (archived) onArchive(false);
                else if (asking === "archive") onArchive(true);
                else setAsking("archive");
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={asking === "delete" ? "Sure?" : "Delete trip"}
              variant="danger"
              busy={busy}
              onPress={() => (asking === "delete" ? onDelete() : setAsking("delete"))}
            />
          </View>
        </View>
      ) : (
        <Body tone="ink-3">Archiving and deleting are an admin&apos;s to do.</Body>
      )}

      {asking === "archive" ? (
        <Body tone="ink-3">Keeps everything, hides it from your list. Members can still open it.</Body>
      ) : null}
    </View>
  );
}
