import { usePathname } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { client } from "@/lib/api";
import { currentConsent, loadConsent } from "@/lib/consent/consent";
import { screenView } from "@/lib/consent/page-views";

export function usePageViews(): void {
  const path = usePathname();

  useEffect(() => {
    void loadConsent();
  }, []);

  useEffect(() => {
    const view = screenView(path, Platform.OS, currentConsent());
    if (view) void client.analytics.track.mutate(view).catch(() => undefined);
  }, [path]);
}
