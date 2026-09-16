"use client";

import { useSyncExternalStore } from "react";

import type { Theme } from "./theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const read = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** The theme the site shows, which can differ from the device's own setting. */
export function useSiteTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}
