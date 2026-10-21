import type { TransportType } from "@floc/core/vocabulary";

/** The line icon for each way to travel, on the 14×14 grid: the route rail draws them as SVG, the maps on a canvas. */
export const MODE_PATHS: Record<TransportType, string[]> = {
  flight: ["M11.03 2.97C11.42 3.36 11.35 3.99 10.85 4.49L8.66 6.68L9.93 11.49L9.09 12.34L6.96 8.38L5.27 10.08L5.48 11.7L4.84 12.34L3.68 10.32L1.66 9.16L2.3 8.52L3.92 8.73L5.62 7.04L1.66 4.91L2.51 4.07L7.32 5.34L9.51 3.15C10.01 2.65 10.64 2.58 11.03 2.97Z"],
  train: ["M4.8 1.8h4.4A1.8 1.8 0 0 1 11 3.6v4.8a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 8.4V3.6a1.8 1.8 0 0 1 1.8-1.8Z", "M3 6.4h8M5 12.2l1-2M9 12.2l-1-2"],
  car: ["M2 9.4V7.2l1.3-3a1 1 0 0 1 .9-.6h5.6a1 1 0 0 1 .9.6l1.3 3v2.2H2ZM2 7.2h10", "M4.4 9.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM9.6 9.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"],
  ferry: ["M2.2 8.2h9.6l-1.4 3H3.6ZM4.2 8.2V5.4h5.6v2.8M7 5.4V2.6"],
  other: ["M2.4 7h9.2M8 3.4 11.6 7 8 10.6"],
};

/** A leg whose way to travel nobody has set yet: a question mark. */
export const UNSET_PATHS = ["M5.2 5.3a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.8.6-.8 1.2v.5", "M7 10.3v.2"];
