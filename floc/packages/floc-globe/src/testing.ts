/** A small outline for the tests: France as a square, Greece as two, Malta as a dot. */
const square = (west: number, south: number, size: number) => [
  [west, south],
  [west + size, south],
  [west + size, south + size],
  [west, south + size],
  [west, south],
];

export const GEO = {
  features: [
    { id: "FR", geometry: { type: "Polygon", coordinates: [square(-2, 43, 6)] } },
    { id: "GR", geometry: { type: "MultiPolygon", coordinates: [[square(21, 37, 5)], [square(24, 35, 1)]] } },
    { id: "MT", geometry: { type: "Point", coordinates: [14.4, 35.9] } },
    { id: "XX", geometry: { type: "LineString", coordinates: [] } },
  ],
};
