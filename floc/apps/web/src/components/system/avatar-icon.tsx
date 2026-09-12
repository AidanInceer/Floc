// The face a person picked, stroked (#157). The geometry is shared with the
// phone app in @floc/core/people/avatar-icon-art — only the renderer is local.
import { AVATAR_ICON_ART } from "@floc/core/people/avatar-icon-art";
import type { AvatarIcon } from "@floc/core/people/avatar-icon";

export function AvatarIconMark({
  icon,
  size = 16,
}: {
  icon: AvatarIcon;
  size?: number;
}) {
  const art = AVATAR_ICON_ART[icon];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {art.circles.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
      ))}
      {art.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
