import type { IconArt } from "@floc/core/people/avatar-icon-art";

export function IconArtMark({ art, size = 16 }: { art: IconArt; size?: number }) {
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
