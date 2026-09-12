/**
 * Your name, edited from the pen on the face card (tickets 46, 302, 157).
 *
 * NAME ONLY SINCE #157. The picture moved to its own sheet, which saves on
 * tap; a text field cannot share that sheet without committing half a name.
 */
import { useState } from "react";
import { View } from "react-native";

import { Sheet } from "../system/sheet";
import { Body, Button, Field } from "../system/ui";
import { space } from "@/lib/theme";

export function IdentitySheet({
  open,
  name,
  busy,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  /** The starting value. Read once, when the sheet opens. */
  name: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: { displayName: string }) => void;
}) {
  const [draftName, setDraftName] = useState(name);

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ padding: space.lg, gap: space.md }}>
        <Field label="Your name" value={draftName} onChangeText={setDraftName} autoFocus />
        {error ? <Body tone="red">{error}</Body> : null}
        <Button
          label="Save"
          busy={busy}
          disabled={!draftName.trim()}
          onPress={() => onSave({ displayName: draftName.trim() })}
        />
      </View>
    </Sheet>
  );
}
