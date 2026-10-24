import type { StyleSpecification } from "@maplibre/maplibre-react-native";

// Why: paper, no tiles — the countries are the drawing, and no map leans on a tile host. Same call
// as the web.
export function paperStyle(background: string): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [
      { id: "paper", type: "background", paint: { "background-color": background } },
    ],
  };
}
