/**
 * The root of the app (ticket 289).
 *
 * Three things wrap everything: the palette, the query cache, and the
 * signed-in/signed-out decision. The last one is a redirect rather than a
 * separate navigator, because a session can end at any moment — a token
 * expiring while a trip is open has to land on sign-in from wherever it was.
 */
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import { DMMono_400Regular, DMMono_500Medium } from "@expo-google-fonts/dm-mono";
import {
  InstrumentSans_400Regular,
  InstrumentSans_600SemiBold,
} from "@expo-google-fonts/instrument-sans";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, useTheme } from "@/components/system/theme";
import { FlocWordmark } from "@/components/system/wordmark";
import { Loading } from "@/components/system/ui";
import { queryClient } from "@/lib/api";
import { useSession } from "@/lib/auth";

/**
 * The six files behind the three faces (#no-ticket). Two weights each for
 * display and sans, two for the mono — the weights the app actually draws.
 * Every one is its own family; see the note in `lib/theme.ts` for why.
 */
const FACES = {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  InstrumentSans_400Regular,
  InstrumentSans_600SemiBold,
  DMMono_400Regular,
  DMMono_500Medium,
};

/** The routes Better Auth's emails redirect into. See `deepLinked` below. */
const DEEP_LINKED = ["reset-password", "verified"];

function Routes() {
  const { c, theme } = useTheme();
  const [facesLoaded] = useFonts(FACES);
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
  // somebody who is already signed in, every cold start. The faces wait with
  // it: text drawn in Roboto and then reflowed into Bricolage is a worse first
  // impression than a beat of nothing.
  if (isPending || !facesLoaded) return <Loading />;

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          // One surface, not two. A sheet-coloured bar over a paper screen
          // draws a tone step, and the hairline under it drew a second line
          // across a screen that is a single column of controls.
          headerStyle: { backgroundColor: c.paper },
          headerShadowVisible: false,
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
