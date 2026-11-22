export type GoogleMapsConfig = { key: string; mapId: string };

const DEMO_STYLE = "DEMO_MAP_ID";

export function googleMapsConfig(env: Record<string, string | undefined> = process.env): GoogleMapsConfig | null {
  const key = env.GOOGLE_MAPS_BROWSER_KEY?.trim();
  if (!key) return null;
  return { key, mapId: env.GOOGLE_MAPS_MAP_ID?.trim() || DEMO_STYLE };
}
