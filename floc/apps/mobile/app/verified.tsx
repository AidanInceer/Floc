import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { Body, Button, Heading, Screen } from "@/components/system/ui";
import { useSession } from "@/lib/auth";
import { space } from "@/lib/theme";

export default function Verified() {
  const router = useRouter();
  const { error } = useLocalSearchParams<{ error?: string }>();
  const { data: session, refetch } = useSession();

  useEffect(() => {
    if (!error) refetch();
  }, [error, refetch]);

  return (
    <Screen>
      <View style={{ gap: space.md }}>
        <Heading>{error ? "That link has expired" : "Email confirmed"}</Heading>
        <Body tone="ink-2">
          {error
            ? "Confirmation links last an hour and work once. Ask for a new one from You."
            : "Your address is confirmed. You can join trips you are invited to."}
        </Body>
        <Button
          label={session?.user ? "Back to your trips" : "Sign in"}
          onPress={() => router.replace(session?.user ? "/trips" : "/sign-in")}
        />
      </View>
    </Screen>
  );
}
