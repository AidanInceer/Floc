/**
 * One renderer for both hands — the faces a person picks (#157) and the marks a
 * trip wears (#318). Same geometry as the web app, from @floc/core, so the two
 * cannot drift; only this renderer is local.
 */
import Svg, { Circle, Path } from "react-native-svg";

import type { IconArt } from "@floc/core/people/avatar-icon-art";

export function IconArtMark({
  art,
  color,
  size = 16,
}: {
  art: IconArt;
  color: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      {art.circles.map((c, i) => (
        <Circle key={i} cx={c.cx} cy={c.cy} r={c.r} stroke={color} strokeWidth={1.2} />
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
