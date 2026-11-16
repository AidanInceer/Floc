export const AVATAR_ICON_LABELS = {
  plane: "Plane",
  compass: "Compass",
  camera: "Camera",
  map: "Map",
  suitcase: "Suitcase",
  mountain: "Mountain",
  boat: "Boat",
  passport: "Passport",
  key: "Key",
  ticket: "Ticket",
  sun: "Sun",
  backpack: "Backpack",
  bicycle: "Bicycle",
  train: "Train",
  balloon: "Hot air balloon",
  lighthouse: "Lighthouse",
  binoculars: "Binoculars",
} as const;

export type AvatarIcon = keyof typeof AVATAR_ICON_LABELS;

export const AVATAR_ICONS = Object.keys(
  AVATAR_ICON_LABELS,
) as readonly AvatarIcon[] as readonly [AvatarIcon, ...AvatarIcon[]];

export function parseAvatarIcon(value: unknown): AvatarIcon | null {
  return typeof value === "string" && value in AVATAR_ICON_LABELS
    ? (value as AvatarIcon)
    : null;
}
