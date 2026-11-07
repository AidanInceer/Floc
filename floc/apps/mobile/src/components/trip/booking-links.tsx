import { Text } from "react-native";

import { useTheme } from "../system/theme";
import { fonts, size } from "@/lib/theme";

const OFFSITE_NOTE = "Opens another site. Floc isn't paid for these links.";

export function OffsiteNote({ centred }: { centred?: boolean }) {
  const { c } = useTheme();
  return (
    <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.label, textAlign: centred ? "center" : "left" }}>
      {OFFSITE_NOTE}
    </Text>
  );
}
