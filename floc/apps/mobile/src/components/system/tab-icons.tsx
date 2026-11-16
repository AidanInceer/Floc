import type { ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const SIZE = 22;
const STROKE = 1.2;

type IconProps = { color: ColorValue };

export function ExploreIcon({ color }: IconProps) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 14 14" fill="none">
      <Circle
        cx={7}
        cy={7}
        r={5.25}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <Path
        d="M1.75 7h10.5M7 1.75c1.6 1.5 2.4 3.25 2.4 5.25S8.6 10.75 7 12.25M7 1.75C5.4 3.25 4.6 5 4.6 7s.8 3.75 2.4 5.25"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TripsIcon({ color }: IconProps) {
  return (
    <Svg width={(SIZE * 28) / 22} height={SIZE} viewBox="0 0 28 22" fill="none">
      <Path
        d="M3.4 16.5 7 12.9 10.6 16.5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.4 10 14 6.4 17.6 10"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.4 16.5 21 12.9 24.6 16.5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function YouIcon({ color }: IconProps) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={4.6} r={2.4} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M2.4 12.2c0-2.3 2.1-3.7 4.6-3.7s4.6 1.4 4.6 3.7"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}
