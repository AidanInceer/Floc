import type { VibeTag } from "@floc/core/trip/vibe-tags";
import Svg, { Path } from "react-native-svg";

const PATHS: Record<VibeTag, string[]> = {
  "early starts": ["M1.8 10.6h10.4", "M3.8 10.6a3.2 3.2 0 0 1 6.4 0", "M7 3.2v1.6M2.9 5.6l1.1 1.1M11.1 5.6 10 6.7"],
  "slow mornings": ["M2.6 5.4h7v3.4a2.6 2.6 0 0 1-2.6 2.6H5.2a2.6 2.6 0 0 1-2.6-2.6Z", "M9.6 6.2h.8a1.4 1.4 0 0 1 0 2.8h-.9M5 2.2v1.4M7.2 2.2v1.4"],
  "late nights": ["M11.4 8.6A4.8 4.8 0 0 1 5.4 2.6a4.8 4.8 0 1 0 6 6Z"],
  "city breaks": ["M1.8 12.2h10.4M2.8 12.2V6.4h3v5.8M5.8 12.2V2.8h3.4v9.4M9.2 12.2V5.4h2v6.8"],
  beaches: ["M1.6 9.4c1.2 0 1.6-1 2.7-1s1.5 1 2.7 1 1.5-1 2.7-1 1.5 1 2.7 1M1.6 11.8c1.2 0 1.6-1 2.7-1s1.5 1 2.7 1 1.5-1 2.7-1 1.5 1 2.7 1", "M11.4 4.2a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z"],
  hiking: ["M1.4 11.8 5.4 4.6l2.2 3.6 1.4-2 3.6 5.6Z", "M4.4 6.4l1 .8 1-.8"],
  "road trips": ["M2 9.4V7.2l1.3-3a1 1 0 0 1 .9-.6h5.6a1 1 0 0 1 .9.6l1.3 3v2.2H2ZM2 7.2h10", "M5.4 10.9a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM10.6 10.9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"],
  "food first": ["M4.2 1.8v4.2M2.8 1.8v2.6a1.4 1.4 0 0 0 2.8 0V1.8M4.2 6v6.2", "M10.2 12.2V1.8c-1.4.6-2.2 2-2.2 3.8v1.6h2.2"],
  museums: ["M1.8 5.2 7 2.2l5.2 3ZM2.6 11.8h8.8M3.6 6.6v4M6.2 6.6v4M7.8 6.6v4M10.4 6.6v4"],
  festivals: ["M3.2 12.4V2M3.2 2.6h7.2L9 4.8l1.4 2.2H3.2"],
};

export function VibeGlyph({ tag, color }: { tag: VibeTag; color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 14 14" fill="none">
      {PATHS[tag].map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={1.15} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
