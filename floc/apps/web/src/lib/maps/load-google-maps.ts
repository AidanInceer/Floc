/// <reference types="google.maps" />

export type GoogleMaps = {
  maps: google.maps.MapsLibrary;
  marker: google.maps.MarkerLibrary;
  core: google.maps.CoreLibrary;
};

type Script = { src: string; async: boolean; onerror: OnErrorEventHandler | (() => void) | null };
type MapsPage = Record<string, unknown> & {
  document: { createElement: (tag: "script") => Script; head: { appendChild: (node: never) => unknown } };
  google?: { maps: { importLibrary: (name: string) => Promise<unknown> } };
  setTimeout: (run: () => void, ms: number) => unknown;
};

const READY = "flocMapsReady";
const SOURCE = "https://maps.googleapis.com/maps/api/js";
const PATIENCE_MS = 8000;

let pending: Promise<GoogleMaps> | null = null;

export function loadGoogleMaps(key: string, page: MapsPage = window as unknown as MapsPage): Promise<GoogleMaps> {
  pending ??= new Promise<GoogleMaps>((resolve, reject) => {
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      pending = null;
      reject(new Error("Google Maps did not load"));
    };
    page[READY] = () => {
      const library = (name: string) => page.google?.maps.importLibrary(name);
      Promise.all([library("maps"), library("marker"), library("core")]).then(
        ([maps, marker, core]) => {
          settled = true;
          resolve({ maps, marker, core } as GoogleMaps);
        },
        fail,
      );
    };
    const script = page.document.createElement("script");
    script.async = true;
    script.src = `${SOURCE}?${new URLSearchParams({ key, v: "weekly", loading: "async", callback: READY })}`;
    script.onerror = fail;
    page.setTimeout(fail, PATIENCE_MS);
    page.document.head.appendChild(script as never);
  });
  return pending;
}
