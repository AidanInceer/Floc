import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

import { client } from "../api";

const ASKED_KEY = "floc.push-asked";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function currentToken(): Promise<string | null> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }
}

export async function registerThisPhone(): Promise<void> {
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  const token = await currentToken();
  if (token) await client.notifications.registerPhone.mutate({ token });
}

export async function forgetThisPhone(): Promise<void> {
  const token = await currentToken();
  if (token) await client.notifications.forgetPhone.mutate({ token }).catch(() => undefined);
}

export async function askForPushOnce(): Promise<void> {
  if (await SecureStore.getItemAsync(ASKED_KEY)) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "undetermined") return;
  await SecureStore.setItemAsync(ASKED_KEY, "1");

  Alert.alert("Hear when it matters", "Floc tells you when someone replies to you, adds an expense with you or changes the dates.", [
    { text: "Not now", style: "cancel" },
    {
      text: "Allow",
      onPress: () =>
        void Notifications.requestPermissionsAsync().then(({ granted }) => (granted ? registerThisPhone() : undefined)),
    },
  ]);
}
