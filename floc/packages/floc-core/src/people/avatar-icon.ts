/**
 * The face a person picks (#157) — seventeen travel objects in the app's own hand, never a photo.
 *
 * Why: seventeen plus the initials cell is three full rows of six, and a nineteenth orphans a row.
 * No uploads or remote images: a roster mixing photographs and line art reads as broken, and an
 * image on a host we do not control carries hotlinking, availability and content risk. Shape only
 * — colour comes from `whoTone`, which is how you follow one member across Money and Packing.
 * Birds were drawn and rejected; they do not hold apart at 28px.
 */

// Values are stored; labels name the control. Order is picker order.
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

// Why: null is the default, not a fallback — an icon dropped in a later release degrades to
// initials rather than a hole.
export function parseAvatarIcon(value: unknown): AvatarIcon | null {
  return typeof value === "string" && value in AVATAR_ICON_LABELS
    ? (value as AvatarIcon)
    : null;
}
