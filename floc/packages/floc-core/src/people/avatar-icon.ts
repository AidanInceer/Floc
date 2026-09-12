/**
 * The face a person picks (ticket 157). Seventeen travel objects, drawn in the
 * app's own hand — never a photo.
 *
 * SEVENTEEN, NOT EIGHTEEN. With the initials cell the picker is eighteen, which
 * is three full rows of six. A nineteenth left one orphan on a row of its own.
 *
 * NO UPLOADS, NO REMOTE IMAGES. A roster mixing photographs and line art reads
 * as broken rather than varied, and an image on a host we do not control
 * carries hotlinking, availability and content risk for no gain. The provider
 * photo went with the upload field.
 *
 * Shape only. The pastel behind it still comes from `whoTone` — the icon is
 * identity, the colour is how you follow one member across Money, Packing and
 * the itinerary, and letting people pick the colour breaks that.
 *
 * Birds were drawn and rejected: they do not hold apart at 28px.
 */

/** Values are stored; labels name the control. Order is picker order. */
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

/**
 * Null means initials, which is the default rather than a fallback — so an
 * icon dropped from the set in a later release degrades to a name, not a hole.
 */
export function parseAvatarIcon(value: unknown): AvatarIcon | null {
  return typeof value === "string" && value in AVATAR_ICON_LABELS
    ? (value as AvatarIcon)
    : null;
}
