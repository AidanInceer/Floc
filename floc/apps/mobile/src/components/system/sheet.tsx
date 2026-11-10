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
import { useReducedMotion } from "./use-reduced-motion";
import { radius, space } from "@/lib/theme";

export function Sheet({
  open,
  onClose,
  children,
  footer,
  stableHeight,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Pinned under the scrolling body, so its buttons stay in reach. */
  footer?: ReactNode;
  stableHeight?: boolean;
}) {
  const { c } = useTheme();
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType={reducedMotion === false ? "fade" : "none"} onRequestClose={onClose}>
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
            borderTopLeftRadius: radius.md,
            borderTopRightRadius: radius.md,
            paddingTop: space.md,
            // Why: the gesture bar sits over the last row of a sheet that ends at
            // the screen edge — the footer buttons were cut in half.
            paddingBottom: space.md + insets.bottom,
            maxHeight: height * 0.85,
            height: stableHeight ? height * 0.72 : undefined,
          }}
        >
          <ScrollView>{children}</ScrollView>
          {footer}
        </View>
      </View>
    </Modal>
  );
}
