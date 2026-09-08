/**
 * Google's own sign-in button (#no-ticket; the web's is in `auth-form.tsx`).
 *
 * THE ONE PLACE A HEX LITERAL IS ALLOWED PAST THE TOKEN RULE (ticket 206). The
 * face, the rule around it, the text colour and the four-colour "G" are
 * prescribed by Google's branding guidelines and are not ours to repaint —
 * tokenising them would make the button wrong in both themes rather than right
 * in one. It stays white in dark mode for the same reason the web's does.
 *
 * It is the only button on the screen that is neither the house primary nor
 * the house quiet, which is the point: a provider button that looked like ours
 * would read as one more of our own controls in a stack of five.
 */
import { ActivityIndicator, Pressable, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

import { fonts, radius, size, space } from "@/lib/theme";

export function GoogleButton({
  label,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => ({
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#747775",
        borderRadius: radius.md,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: space.md,
        opacity: off ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {busy ? (
        <ActivityIndicator color="#1f1f1f" />
      ) : (
        <>
          <GoogleG />
          <Text
            style={{
              color: "#1f1f1f",
              fontFamily: fonts.sans,
              fontSize: size.body,
              fontWeight: "600",
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** Google's official four-colour "G", path for path as the web app draws it. */
function GoogleG() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <Path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <Path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <Path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z"
      />
    </Svg>
  );
}
