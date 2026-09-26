import type { ReactNode } from "react";
import { View } from "react-native";

import { useTheme } from "./theme";

export function TabTile({ on, mark }: { on: boolean; mark: (color: string) => ReactNode }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: 40,
        height: 28,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: on ? c["pen-2"] : "transparent",
      }}
    >
      {mark(on ? c["pen-deep"] : c.pen)}
    </View>
  );
}
