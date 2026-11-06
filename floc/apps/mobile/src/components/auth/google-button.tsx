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
        borderRadius: radius.sm,
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
              fontFamily: fonts.sansBold,
              fontSize: size.body,
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

/** The same white button for the calendar import (#444): Google's Calendar mark on the left, the words after it. */
export function GoogleCalendarButton({
  label,
  onPress,
  busy,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!busy, busy: !!busy }}
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => ({
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#747775",
        borderRadius: radius.sm,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: space.md,
        opacity: busy ? 0.6 : pressed ? 0.85 : 1,
      })}
    >
      <GoogleCalendarMark />
      <Text style={{ color: "#1f1f1f", fontFamily: fonts.sansBold, fontSize: size.body }}>{label}</Text>
    </Pressable>
  );
}

/** Google's Google Calendar mark, path for path as the web app draws it. */
export function GoogleCalendarMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 200 200">
      <Path fill="#fff" d="M152.637 47.363H47.363v105.274h105.274z" />
      <Path fill="#ea4335" d="M152.637 200 200 152.637l-23.682-4.012-23.681 4.012-4.012 22.682z" />
      <Path fill="#188038" d="M0 152.637v31.579C0 193.4 6.6 200 15.784 200h31.579l5.263-23.683-5.263-23.68-26.32-4.012z" />
      <Path fill="#1967d2" d="M200 47.363V15.784C200 6.6 193.4 0 184.216 0h-31.579c-2.632 10.526-5.263 22.368-5.263 23.684s2.631 23.68 5.263 23.68l26.32 4.013z" />
      <Path fill="#fbbc04" d="M200 47.363h-47.363v105.274H200z" />
      <Path fill="#34a853" d="M152.637 152.637H47.363V200h105.274z" />
      <Path fill="#4285f4" d="M15.784 0C6.6 0 0 6.6 0 15.784v136.853h47.363V47.363h105.274V0z" />
      <Path
        fill="#4285f4"
        d="M68.97 129.03c-3.93-2.65-6.65-6.53-8.14-11.66l9.13-3.76c.83 3.16 2.28 5.6 4.35 7.34 2.06 1.74 4.55 2.6 7.47 2.6 2.99 0 5.55-.91 7.68-2.73 2.13-1.82 3.2-4.13 3.2-6.94 0-2.88-1.13-5.22-3.4-7.04-2.27-1.82-5.12-2.73-8.52-2.73h-5.27v-9.05h4.73c2.92 0 5.38-.79 7.38-2.37 2-1.58 3-3.74 3-6.49 0-2.44-.89-4.39-2.68-5.85-1.79-1.46-4.05-2.2-6.8-2.2-2.68 0-4.81.71-6.39 2.14-1.58 1.43-2.73 3.2-3.43 5.27l-9.05-3.77c1.2-3.4 3.4-6.4 6.62-9 3.22-2.6 7.33-3.9 12.32-3.9 3.69 0 7.01.71 9.95 2.14 2.94 1.43 5.25 3.41 6.92 5.94 1.67 2.54 2.5 5.38 2.5 8.54 0 3.22-.78 5.94-2.33 8.17-1.55 2.23-3.46 3.94-5.73 5.14v.54c2.99 1.25 5.43 3.16 7.35 5.73 1.92 2.57 2.88 5.64 2.88 9.22 0 3.58-.91 6.78-2.73 9.6-1.82 2.82-4.34 5.04-7.54 6.66-3.22 1.62-6.84 2.44-10.86 2.44-4.65 0-8.94-1.33-12.87-3.98z"
      />
      <Path fill="#4285f4" d="m137.34 85.7-9.97 7.21-5.01-7.6 17.96-12.95h6.89v61.1h-9.87z" />
    </Svg>
  );
}
