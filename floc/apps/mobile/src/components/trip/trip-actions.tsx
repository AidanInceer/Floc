/**
 * The foot of the trip sheet: archive, delete, save — one line (ticket 05, 17).
 *
 * WHY ONE LINE. These were three full-width bars stacked under a rule, which
 * pushed Save off a phone screen on a trip with two tags: you scrolled past
 * Delete to reach it. They are all "I am done with this sheet", so they share
 * the line the way the web shares a dialog's footer.
 *
 * TWO PRESSES, NEVER ONE, and the guard is the label. Neither archive nor
 * delete has an undo, and a sheet is a place a thumb lands by accident. The
 * first press turns the word into "Sure?", the second does it — no dialog,
 * because a dialog here is a second window over a window, and no extra row,
 * because an extra row is what this was fixing.
 *
 * ADMIN-ONLY, AND SAID SO (rule 6). A member gets Save and a sentence naming
 * who can do the rest, never a dead button.
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
  saving,
  onArchive,
  onDelete,
  onSave,
}: {
  isAdmin: boolean;
  archived: boolean;
  busy: boolean;
  saving: boolean;
  onArchive: (next: boolean) => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  const [asking, setAsking] = useState<Pending>(null);

  return (
    <View style={{ gap: space.sm }}>
      <Divider />
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        {isAdmin ? (
          <>
            <View style={{ flex: 1 }}>
            <Button
              label={archived ? "Restore" : asking === "archive" ? "Sure?" : "Archive"}
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
                label={asking === "delete" ? "Sure?" : "Delete"}
                variant="danger"
                busy={busy}
                onPress={() => (asking === "delete" ? onDelete() : setAsking("delete"))}
              />
            </View>
          </>
        ) : null}
        <View style={{ flex: 1 }}>
          <Button label="Save" busy={saving} onPress={onSave} />
        </View>
      </View>

      {asking === "archive" ? (
        <Body tone="ink-3">Keeps everything, hides it from your list. Members can still open it.</Body>
      ) : null}
      {isAdmin ? null : (
        <Body tone="ink-3">Archiving and deleting are an admin&apos;s to do.</Body>
      )}
    </View>
  );
}
