import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "./theme";
import { useStill } from "@/lib/accessibility/use-still";
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
  footer?: ReactNode;
  stableHeight?: boolean;
}) {
  const { c } = useTheme();
  const reducedMotion = useStill();
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
