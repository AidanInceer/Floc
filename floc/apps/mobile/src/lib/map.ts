import type { StyleSpecification } from "@maplibre/maplibre-react-native";

export function paperStyle(background: string): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [
      { id: "paper", type: "background", paint: { "background-color": background } },
    ],
  };
}
