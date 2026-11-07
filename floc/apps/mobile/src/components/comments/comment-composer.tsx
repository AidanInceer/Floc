/**
 * One line that grows as you type, with Post inside it — the web's composer (event comments D).
 * No face beside it on a phone: it is furniture, and the row is a budget.
 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, radius, size, space } from "@/lib/theme";

export function CommentComposer({
  label,
  busy,
  initial,
  sendLabel = "Post",
  pendingLabel = "Posting…",
  autoFocus,
  onSend,
  onCancel,
}: {
  /** Said aloud; the field itself starts empty. */
  label: string;
  busy: boolean;
  initial?: string;
  sendLabel?: string;
  /** What the button says while this box's words are on their way. */
  pendingLabel?: string;
  autoFocus?: boolean;
  /** Sends the trimmed words. The caller clears the box by remounting it once they land. */
  onSend: (body: string) => void;
  onCancel?: () => void;
}) {
  const { c } = useTheme();
  const [body, setBody] = useState(initial ?? "");
  // Why: `busy` covers the whole thread; only the box that sent says Posting.
  const [sentHere, setSentHere] = useState(false);
  const said = body.trim();
  const off = !said || busy;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <View style={{ flex: 1 }}>
        <TextInput
          accessibilityLabel={label}
          value={body}
          onChangeText={(next) => {
            setBody(next);
            setSentHere(false);
          }}
          multiline
          autoFocus={autoFocus}
          maxLength={2000}
          style={{
            minHeight: 44,
            maxHeight: 160,
            backgroundColor: c.sheet,
            borderColor: c["rule-2"],
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.sm,
            paddingVertical: space.sm + 2,
            paddingLeft: space.md,
            paddingRight: 72,
            color: c.ink,
            fontFamily: fonts.sans,
            fontSize: size.body,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sendLabel}
          accessibilityState={{ disabled: off, busy }}
          disabled={off}
          onPress={() => {
            setSentHere(true);
            onSend(said);
          }}
          hitSlop={4}
          style={{
            position: "absolute",
            right: 5,
            bottom: 5,
            height: 34,
            paddingHorizontal: space.md,
            justifyContent: "center",
            borderRadius: radius.sm,
            backgroundColor: off ? c["sheet-2"] : c.pen,
          }}
        >
          <Text
            style={{
              color: off ? c["ink-3"] : c.sheet,
              fontFamily: fonts.sansBold,
              fontSize: size.small,
            }}
          >
            {busy && sentHere ? pendingLabel : sendLabel}
          </Text>
        </Pressable>
      </View>
      {onCancel ? (
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          hitSlop={8}
          style={{ paddingVertical: space.sm }}
        >
          <Text
            style={{
              color: c["ink-2"],
              fontFamily: fonts.sansBold,
              fontSize: size.small,
            }}
          >
            Cancel
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
