import type { ProFeatureKey } from "@/lib/landing/pro-tour";

import type { GlyphName } from "../landing-glyph";

export const FEATURE_GLYPH: Record<ProFeatureKey, GlyphName> = {
  weather: "weather",
  packing: "packing",
  search: "flight",
  files: "files",
  agent: "agent",
  live: "live",
  local: "local",
  extension: "extension",
  forward: "mail",
  receipt: "receipt",
  offline: "offline",
  keep: "keep",
};
