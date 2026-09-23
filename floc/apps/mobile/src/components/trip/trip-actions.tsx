/**
 * The foot of the trip sheet: archive and delete, on one line (ticket 05, 17).
 *
 * THERE IS NO SAVE. The sheet writes what you typed when it shuts, so a Save
 * button would only ask you to confirm a thing you had already done. What is
 * left are the two that end the trip, and they share the line the way the web
 * shares a dialog's footer.
 *
 * TWO PRESSES, NEVER ONE, and the guard is the label. Neither archive nor
 * delete has an undo, and a sheet is a place a thumb lands by accident. The
 * first press turns the word into "Sure?", the second does it — no dialog,
 * because a dialog here is a second window over a window, and no extra row,
 * because an extra row is what this was fixing.
 *
 * ADMIN-ONLY, AND SAID SO (rule 6). A member gets a sentence naming who can
 * do these, never a dead button.
 */
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
