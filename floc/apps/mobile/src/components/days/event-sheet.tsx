/**
 * The full-height shell an event opens in (ticket 325) — title, a way out, and
 * one scroll.
 *
 * NOT `Sheet`. That caps at 60% for a list of options; this holds a form, and
 * the composer inside it has to clear the keyboard.
 *
 * TWO CALLERS, SO IT IS A COMPONENT. Adding an event and opening one wear the
 * same shell, and the second was not going to copy the first's header, its
 * keyboard handling and its way out.
 */
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CrossGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { Heading, IconButton } from "../system/ui";
import { space } from "@/lib/theme";

export function EventSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { c } = useTheme();
  // A `Modal` sits outside the screen's safe area, so the title lands under
  // the clock unless it is inset itself.
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: c.paper }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: space.md,
            paddingHorizontal: space.lg,
            paddingBottom: space.md,
            paddingTop: insets.top + space.md,
          }}
        >
          <Heading>{title}</Heading>
          <IconButton label="Close" onPress={onClose}>
            {(color) => <CrossGlyph color={color} />}
          </IconButton>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: space.lg,
            paddingBottom: insets.bottom + space.lg,
            gap: space.lg,
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
