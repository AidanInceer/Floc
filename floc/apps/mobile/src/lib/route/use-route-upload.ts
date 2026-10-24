import * as Network from "expo-network";
import { useEffect } from "react";
import { AppState } from "react-native";

import { flushRoute } from "./route-task";

/** Positions taken offline go up when the signal is back, or when the app is opened (#329). */
export function useRouteUpload(signedIn: boolean) {
  useEffect(() => {
    if (!signedIn) return;
    void flushRoute();
    const net = Network.addNetworkStateListener((state) => {
      if (state.isInternetReachable) void flushRoute();
    });
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") void flushRoute();
    });
    return () => {
      net.remove();
      app.remove();
    };
  }, [signedIn]);
}
