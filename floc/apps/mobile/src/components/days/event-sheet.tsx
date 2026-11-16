import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CrossGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { useReducedMotion } from "../system/use-reduced-motion";
import { Heading, IconButton } from "../system/ui";
import { fonts, size, space } from "@/lib/theme";

export function EventSheet({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { c } = useTheme();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType={reducedMotion === false ? "slide" : "none"} onRequestClose={onClose}>
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
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Heading>{title}</Heading>
            {subtitle ? (
              <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.label, fontVariant: ["tabular-nums"] }}>{subtitle}</Text>
            ) : null}
          </View>
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
