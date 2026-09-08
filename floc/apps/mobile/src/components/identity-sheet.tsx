/**
 * Your name and your picture, edited from the face card (tickets 46, 302).
 *
 * ITS OWN FILE BECAUSE THE SCREEN GOT BRANCHY. Two sheets and three reads on
 * one screen is past what one function should hold; the draft, its two fields
 * and the guard against saving an empty name are one job.
 *
 * A URL, NOT AN UPLOAD. Uploading a file is its own decision that has not been
 * taken (#46), and until it lands this is the only way to have a picture.
 * Blank is a real answer: it means initials, which is the default rather than
 * a fallback.
 */
import { useState } from "react";
import { View } from "react-native";

import { Sheet } from "./sheet";
import { Body, Button, Field } from "./ui";
import { space } from "@/lib/theme";

export function IdentitySheet({
  open,
  name,
  avatarUrl,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  /** The starting values. Read once, when the sheet opens. */
  name: string;
  avatarUrl: string | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: { displayName: string; avatarUrl: string | null }) => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [draftUrl, setDraftUrl] = useState(avatarUrl ?? "");

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ padding: space.lg, gap: space.md }}>
        <Field label="Your name" value={draftName} onChangeText={setDraftName} autoFocus />
        <Field
          label="Picture address"
          value={draftUrl}
          placeholder="https://…"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setDraftUrl}
        />
        <Body tone="ink-3">Leave the address blank for your initials.</Body>
        {error ? <Body tone="red">{error}</Body> : null}
        <Button
          label="Save"
          busy={busy}
          disabled={!draftName.trim()}
          onPress={() =>
            onSave({
              displayName: draftName.trim(),
              avatarUrl: draftUrl.trim() || null,
            })
          }
        />
      </View>
    </Sheet>
  );
}
