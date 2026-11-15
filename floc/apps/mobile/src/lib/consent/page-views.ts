/** Counts a screen view, only with a yes to analytics (#368). A failed count is dropped: it must never show. */
import { usePathname } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { client } from "@/lib/api";
import { currentConsent, loadConsent } from "@/lib/consent/consent";

export function usePageViews(): void {
  const path = usePathname();

  useEffect(() => {
    void loadConsent();
  }, []);

  useEffect(() => {
    if (!currentConsent().analytics) return;
    const surface = Platform.OS === "ios" ? "ios" : "android";
    void client.analytics.track.mutate({ name: "page.view", path, surface }).catch(() => undefined);
  }, [path]);
}
