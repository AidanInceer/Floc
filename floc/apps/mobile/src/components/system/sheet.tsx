/**
 * A sheet that rises from the foot of the screen (#302, lifted out of the
 * `Dropdown` in `ui`).
 *
 * WHY IT IS ITS OWN FILE. Two things now need it — picking a category and
 * renaming a trip — and the second was not going to copy the first's backdrop,
 * its radius and its way out. A shape with two callers is a component; that is
 * the whole rule (YAGNI, met).
 *
 * THE BACKDROP CLOSES IT. A sheet whose only exit is an answer is a question
 * that cannot be withdrawn.
 *
 * IT SCROLLS AND IT IS CAPPED. Twenty-four hours of options is taller than a
 * phone, and a sheet that runs off the top of the screen has choices nobody
 * can reach.
 *
 * DIMMED WITH INK, NOT BLACK. There is no scrim token and no hex is allowed,
 * so the dim is `ink` at low opacity — as a *sibling* of the sheet, because
 * `opacity` cascades to children and would grey the content too.
 */
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "./theme";
import { radius, space } from "@/lib/theme";

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { c } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={{ flex: 1 }}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.ink, opacity: 0.35 }]} />
        </Pressable>
        <View
          style={{
            backgroundColor: c.sheet,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            paddingTop: space.md,
            // Why: the gesture bar sits over the last row of a sheet that ends at
            // the screen edge — the footer buttons were cut in half.
            paddingBottom: space.md + insets.bottom,
            maxHeight: height * 0.85,
          }}
        >
          <ScrollView>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}
