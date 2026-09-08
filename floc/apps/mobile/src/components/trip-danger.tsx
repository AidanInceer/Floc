/**
 * Archiving and deleting a trip, under the sheet that edits it (ticket 05, 17).
 *
 * ITS OWN FILE, AND ITS OWN HALF OF THE SHEET. Renaming a trip and deleting it
 * are the same rare job in the same rare place, so they share the sheet — but
 * they are not the same *kind* of job, and `TripEdit` was already at its prop
 * ceiling. A rule and a heading separate them; the ceiling did the arguing.
 *
 * TWO PRESSES, NEVER ONE. Neither of these has an undo on the phone, and a
 * sheet is a place a thumb lands by accident. The first press asks, the second
 * does it — no dialog, because a dialog here would be a second window over a
 * sheet that is already a second window.
 *
 * ADMIN-ONLY, AND SAID SO (rule 6). A member sees why the controls are absent
 * rather than seeing a dead button with a sentence under it.
 */
import { useState } from "react";
import { View } from "react-native";

import { Body, Button, Divider, Label } from "./ui";
import { space } from "@/lib/theme";

type Pending = "archive" | "delete" | null;

export function TripDanger({
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

  if (!isAdmin) {
    return (
      <View style={{ gap: space.sm }}>
        <Divider />
        <Body tone="ink-3">
          Archiving and deleting are an admin&apos;s to do. Ask one of them.
        </Body>
      </View>
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <Divider />
      <Label>{archived ? "Restore or delete" : "Archive or delete"}</Label>

      {archived ? (
        <Button
          label="Restore this trip"
          variant="quiet"
          busy={busy}
          onPress={() => onArchive(false)}
        />
      ) : asking === "archive" ? (
        <>
          <Button label="Yes, archive it" variant="quiet" busy={busy} onPress={() => onArchive(true)} />
          <Button label="Keep it" variant="quiet" onPress={() => setAsking(null)} />
        </>
      ) : (
        <Button label="Archive this trip" variant="quiet" onPress={() => setAsking("archive")} />
      )}

      {asking === "delete" ? (
        <>
          {/* The one thing the button cannot say: what does not come back. */}
          <Body tone="red">
            Everything on it goes — days, money, packing and notes. There is no undo.
          </Body>
          <Button label="Yes, delete it" variant="danger" busy={busy} onPress={onDelete} />
          <Button label="Keep it" variant="quiet" onPress={() => setAsking(null)} />
        </>
      ) : (
        <Button label="Delete this trip" variant="danger" onPress={() => setAsking("delete")} />
      )}

      {archived ? null : (
        <Body tone="ink-3">
          Archiving keeps everything and hides the trip from your list. Every member can
          still open it.
        </Body>
      )}
    </View>
  );
}
