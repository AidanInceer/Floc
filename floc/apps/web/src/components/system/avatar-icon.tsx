// The face a person picked, stroked (#157). The geometry is shared with the
// phone app in @floc/core/people/avatar-icon-art — only the renderer is local.
import { AVATAR_ICON_ART } from "@floc/core/people/avatar-icon-art";
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import { IconArtMark } from "@/components/system/icon-art";

export function AvatarIconMark({
  icon,
  size = 16,
}: {
  icon: AvatarIcon;
  size?: number;
}) {
  return <IconArtMark art={AVATAR_ICON_ART[icon]} size={size} />;
}
