/**
 * Why on both screens (#549): Google on the sign-in screen also makes a new account, and the record of which
 * terms an account agreed to is true only if the person saw this line first.
 */
import { Linking, Text } from "react-native";

import { useTheme } from "@/components/system/theme";
import { API_BASE_URL } from "@/lib/config";
import { fonts, size } from "@/lib/theme";

const open = (path: string) => () => void Linking.openURL(`${API_BASE_URL}${path}`);

export function TermsLine() {
  const { c } = useTheme();
  return (
    <Text style={{ color: c["ink-3"], fontFamily: fonts.sans, fontSize: size.small }}>
      {"By continuing you agree to the "}
      <Text accessibilityRole="link" style={{ textDecorationLine: "underline" }} onPress={open("/terms")}>
        Terms of use
      </Text>
      {" and the "}
      <Text accessibilityRole="link" style={{ textDecorationLine: "underline" }} onPress={open("/privacy")}>
        Privacy policy
      </Text>
      .
    </Text>
  );
}
