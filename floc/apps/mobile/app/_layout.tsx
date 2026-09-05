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
import { Loading } from "@/components/ui";
import { queryClient } from "@/lib/api";
import { useSession } from "@/lib/auth";

function Routes() {
  const { c, theme } = useTheme();
  const { data: session, isPending } = useSession();
  const segments = useSegments();
  const router = useRouter();

  const signedIn = !!session?.user;
  const inApp = segments[0] === "(app)";

  useEffect(() => {
    if (isPending) return;
    if (!signedIn && inApp) router.replace("/sign-in");
    if (signedIn && !inApp) router.replace("/(app)/trips");
  }, [isPending, signedIn, inApp, router]);

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
        <Stack.Screen name="sign-in" options={{ title: "Floc" }} />
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
