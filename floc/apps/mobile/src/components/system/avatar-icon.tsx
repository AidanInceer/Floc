/**
 * The face a person picked, stroked (#157). Same geometry as the web app —
 * @floc/core/people/avatar-icon-art holds it, so the two cannot drift.
 */
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import { AVATAR_ICON_ART } from "@floc/core/people/avatar-icon-art";

import { IconArtMark } from "./icon-art";

export function AvatarIconMark({
  icon,
  color,
  size = 16,
}: {
  icon: AvatarIcon;
  color: string;
  size?: number;
}) {
  return <IconArtMark art={AVATAR_ICON_ART[icon]} color={color} size={size} />;
}
