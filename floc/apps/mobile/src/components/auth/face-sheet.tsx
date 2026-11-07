/**
 * Your name, in one sheet from the face card (C3b). The face is always initials, so there is no picture to pick.
 */
import { useState } from "react";
import { View } from "react-native";

import { Sheet } from "../system/sheet";
import { Body, Button, Field } from "../system/ui";
import { space } from "@/lib/theme";

export function FaceSheet({
  name,
  busy,
  error,
  onClose,
  onSave,
}: {
  /** The starting values. Read once: the parent mounts this only while it is open. */
  name: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: { displayName: string }) => void;
}) {
  const [draftName, setDraftName] = useState(name);

  return (
    <Sheet open onClose={onClose}>
      <View style={{ padding: space.lg, gap: space.md }}>
        <Field
          label="Name"
          value={draftName}
          onChangeText={setDraftName}
          autoFocus
          testID="face-name"
        />
        {error ? <Body tone="red">{error}</Body> : null}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: space.sm,
          }}
        >
          <Button
            label="Cancel"
            variant="quiet"
            fit="small"
            onPress={onClose}
          />
          <Button
            label="Save"
            fit="small"
            busy={busy}
            disabled={!draftName.trim()}
            onPress={() =>
              onSave({ displayName: draftName.trim() })
            }
          />
        </View>
      </View>
    </Sheet>
  );
}
