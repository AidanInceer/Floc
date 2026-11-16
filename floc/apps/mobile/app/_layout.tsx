import { RedHatDisplay_800ExtraBold } from "@expo-google-fonts/red-hat-display/800ExtraBold";
import { RedHatMono_400Regular } from "@expo-google-fonts/red-hat-mono/400Regular";
import { RedHatMono_500Medium } from "@expo-google-fonts/red-hat-mono/500Medium";
import { RedHatText_400Regular } from "@expo-google-fonts/red-hat-text/400Regular";
import { RedHatText_400Regular_Italic } from "@expo-google-fonts/red-hat-text/400Regular_Italic";
import { RedHatText_600SemiBold } from "@expo-google-fonts/red-hat-text/600SemiBold";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, useTheme } from "@/components/system/theme";
import { LaunchCurtain } from "@/components/system/launch";
import { useReducedMotion } from "@/components/system/use-reduced-motion";
import { FlocWordmark } from "@/components/system/wordmark";
import { queryClient } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { signOutHere } from "@/lib/sign-out";
import { onSessionEnded, sessionResumed } from "@/lib/session/session-ended";

const FACES = {
  RedHatDisplay_800ExtraBold,
  RedHatText_400Regular,
  RedHatText_400Regular_Italic,
  RedHatText_600SemiBold,
  RedHatMono_400Regular,
  RedHatMono_500Medium,
};

const DEEP_LINKED = ["reset-password", "verified"];

function Routes() {
  const { c, theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [facesLoaded] = useFonts(FACES);
  const { data: session, isPending } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const [launched, setLaunched] = useState(false);
  const finishLaunch = useCallback(() => setLaunched(true), []);

  const signedIn = !!session?.user;
  const inApp = segments[0] === "(app)";
  const deepLinked = DEEP_LINKED.includes(segments[0] as string);

  useEffect(() => onSessionEnded(() => void signOutHere({ expired: true }).catch(() => undefined)), []);
  useEffect(() => {
    if (signedIn) sessionResumed();
  }, [signedIn]);

  const ready = !isPending && facesLoaded;

  const landed = segments[0] as string | undefined;
  useEffect(() => {
    if (!ready || landed === undefined) return;
    if (!signedIn && inApp) router.replace("/sign-in");
    if (signedIn && !inApp && !deepLinked) router.replace("/trips");
  }, [ready, landed, signedIn, inApp, deepLinked, router]);

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      {ready && (
        <Stack
          screenOptions={{
            animation: reducedMotion === false ? "default" : "none",
            headerStyle: { backgroundColor: c.paper },
            headerShadowVisible: false,
            headerTintColor: c.ink,
            contentStyle: { backgroundColor: c.paper },
          }}
        >
          <Stack.Screen
            name="sign-in"
            options={{ headerTitle: () => <FlocWordmark />, headerTitleAlign: "center" }}
          />
          <Stack.Screen name="sign-up" options={{ title: "Create an account" }} />
          <Stack.Screen name="forgot-password" options={{ title: "Forgotten password" }} />
          <Stack.Screen name="reset-password" options={{ title: "New password" }} />
          <Stack.Screen name="verified" options={{ title: "Email confirmed" }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      )}
      {!launched && <LaunchCurtain ready={ready} onDone={finishLaunch} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Routes />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
