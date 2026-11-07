// Why no tile: a filled block behind the open tab read as heavy chrome; the open tab now says so in colour and weight only.
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { useTheme } from "./theme";
import { fonts, size } from "@/lib/theme";

export function TabMark({ on, mark }: { on: boolean; mark: (color: string) => ReactNode }) {
  const { c } = useTheme();
  return <View style={{ width: 32, height: 24, alignItems: "center", justifyContent: "center" }}>{mark(on ? c.pen : c["ink-2"])}</View>;
}

export function TabLabel({ on, children }: { on: boolean; children: string }) {
  const { c } = useTheme();
  return (
    <Text style={{ color: on ? c.ink : c["ink-3"], fontFamily: on ? fonts.sansBold : fonts.sans, fontSize: size.label, marginTop: 2 }}>
      {children}
    </Text>
  );
}
