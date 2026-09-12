/**
 * The face a person picked, stroked (#157). Same geometry as the web app —
 * @floc/core/people/avatar-icon-art holds it, so the two cannot drift.
 */
import Svg, { Circle, Path } from "react-native-svg";

import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import { AVATAR_ICON_ART } from "@floc/core/people/avatar-icon-art";

export function AvatarIconMark({
  icon,
  color,
  size = 16,
}: {
  icon: AvatarIcon;
  color: string;
  size?: number;
}) {
  const art = AVATAR_ICON_ART[icon];
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      {art.circles.map((c, i) => (
        <Circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          stroke={color}
          strokeWidth={1.2}
        />
      ))}
      {art.paths.map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
