/**
 * The root of the app (ticket 289).
 *
 * Three things wrap everything: the palette, the query cache, and the
 * signed-in/signed-out decision. The last one is a redirect rather than a
 * separate navigator, because a session can end at any moment — a token
 * expiring while a trip is open has to land on sign-in from wherever it was.
 */
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, useTheme } from "@/components/theme";
import { FlocWordmark } from "@/components/wordmark";
import { Loading } from "@/components/ui";
import { queryClient } from "@/lib/api";
import { useSession } from "@/lib/auth";

/** The routes Better Auth's emails redirect into. See `deepLinked` below. */
const DEEP_LINKED = ["reset-password", "verified"];

function Routes() {
  const { c, theme } = useTheme();
  const { data: session, isPending } = useSession();
  const segments = useSegments();
  const router = useRouter();

  const signedIn = !!session?.user;
  const inApp = segments[0] === "(app)";
  // A deep link is not a navigation, and these three arrive as one: a reset
  // link opens while signed out *and* while signed in, and throwing the
  // holder at /trips would strand the token. So the signed-in redirect skips
  // them; the signed-out one does not need to, they already sit outside (app).
  const deepLinked = DEEP_LINKED.includes(segments[0] as string);

  useEffect(() => {
    if (isPending) return;
    if (!signedIn && inApp) router.replace("/sign-in");
    if (signedIn && !inApp && !deepLinked) router.replace("/trips");
  }, [isPending, signedIn, inApp, deepLinked, router]);

  // Rendering a screen before the session is known would flash sign-in at
  // somebody who is already signed in, every cold start.
  if (isPending) return <Loading />;

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.sheet },
          headerTintColor: c.ink,
          contentStyle: { backgroundColor: c.paper },
        }}
      >
        {/* The mark, centred, instead of the word "Floc" — the first thing
            somebody sees on opening the app should be the mark itself. */}
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
