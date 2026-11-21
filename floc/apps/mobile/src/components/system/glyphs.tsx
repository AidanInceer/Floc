import type { WeatherCondition } from "@floc/core/itinerary/weather";
import Svg, { Circle, G, Path } from "react-native-svg";

const STROKE = 1.2;

export function TickGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path
        d="M2.6 7.4 5.6 10.4 11.4 4"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CrossGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M3.6 3.6 10.4 10.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M10.4 3.6 3.6 10.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function SearchGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Circle cx={6.2} cy={6.2} r={3.8} stroke={color} strokeWidth={STROKE} />
      <Path d="M9 9 11.6 11.6" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M7 3.2V10.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M3.2 7H10.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function MinusGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M3.2 7H10.8" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function SortGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M2 3.5h9M2 7h6M2 10.5h3" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function FilterGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M2 3h10L8.2 7.6V11L5.8 12V7.6z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronGlyph({ color, open }: { color: string; open?: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none" style={open ? { transform: [{ rotate: "180deg" }] } : undefined}>
      <Path d="M3.4 5.4 7 9l3.6-3.6" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PenGlyph({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M9.3 2.6l2.1 2.1-6 6-2.6.5.5-2.6 6-6z" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MoreGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Circle cx={3.2} cy={7} r={1} fill={color} />
      <Circle cx={7} cy={7} r={1} fill={color} />
      <Circle cx={10.8} cy={7} r={1} fill={color} />
    </Svg>
  );
}

export function ShareGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Circle cx={10.5} cy={2.9} r={1.75} stroke={color} strokeWidth={1.2} />
      <Circle cx={3.5} cy={7} r={1.75} stroke={color} strokeWidth={1.2} />
      <Circle cx={10.5} cy={11.1} r={1.75} stroke={color} strokeWidth={1.2} />
      <Path
        d="M5 7.9l4 2.3M9 3.8L5 6.1"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AddPersonGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Circle cx={5.4} cy={4.8} r={2} stroke={color} strokeWidth={STROKE} />
      <Path d="M1.8 11.4c0-1.9 1.5-3 3.6-3s3.6 1.1 3.6 3M10.6 4.2v3.6M8.8 6h3.6" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function NoteGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M3 4h8M3 7h8M3 10h5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function GroupGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Circle cx={5} cy={5} r={1.9} stroke={color} strokeWidth={STROKE} />
      <Circle cx={10} cy={5.6} r={1.5} stroke={color} strokeWidth={STROKE} />
      <Path d="M1.6 11.4c.4-1.8 1.7-2.8 3.4-2.8s3 1 3.4 2.8M9.4 8.7c1.5 0 2.6.9 3 2.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CalendarGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M3.4 3h7.2A1.4 1.4 0 0 1 12 4.4v6.4a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 10.8V4.4A1.4 1.4 0 0 1 3.4 3ZM4.8 1.8v2.4M9.2 1.8v2.4M2 6h10" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RibbonGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={30} viewBox="0 0 16 30">
      <Path d="M0 0h16v30l-8-6-8 6Z" fill={color} />
    </Svg>
  );
}

export function BedGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M1.8 11.5V3.5M1.8 8.2h10.4v3.3M12.2 8.2V7a1.5 1.5 0 0 0-1.5-1.5H6.2v2.7"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={4} cy={6.4} r={1} stroke={color} strokeWidth={STROKE} />
    </Svg>
  );
}

export function OutGlyph({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 14 14" fill="none">
      <Path
        d="M5 2.5h6.5V9M11.5 2.5 2.5 11.5"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClipGlyph({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 14 14" fill="none">
      <Path
        d="M10.5 6.5 6 11a2.6 2.6 0 0 1-3.7-3.7l5.2-5.2a1.7 1.7 0 0 1 2.4 2.4L4.7 9.7a.8.8 0 0 1-1.2-1.2l4.6-4.6"
        stroke={color}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SunGlyph({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={7} r={2.5} stroke={color} strokeWidth={1.2} />
      <Path
        d="M7 1.3v1.3M7 11.4v1.3M1.3 7h1.3M11.4 7h1.3M3 3l.9.9M10.1 10.1l.9.9M11 3l-.9.9M3.9 10.1 3 11"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MoonGlyph({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 14 14" fill="none">
      <Path
        d="M10.9 9.4A4.6 4.6 0 0 1 6 2a5 5 0 1 0 4.9 7.4Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BellGlyph({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 14 14" fill="none">
      <Path
        d="M3.5 9.8V6.3a3.5 3.5 0 0 1 7 0v3.5l1 1.2h-9l1-1.2ZM5.8 12.3a1.3 1.3 0 0 0 2.4 0"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StarGlyph({ color, on }: { color: string; on: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path
        d="M7 1.9 8.6 5.2 12.2 5.7 9.6 8.2 10.2 11.8 7 10.1 3.8 11.8 4.4 8.2 1.8 5.7 5.4 5.2Z"
        stroke={color}
        fill={on ? color : "none"}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const WEATHER_PATHS: Record<WeatherCondition, string[]> = {
  sun: [
    "M7 4.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z",
    "M7 1.4v1.4M7 11.2v1.4M1.4 7h1.4M11.2 7h1.4",
    "M3 3l1 1M10 10l1 1M11 3l-1 1M4 10l-1 1",
  ],
  part: [
    "M5 3.4a1.8 1.8 0 1 0 1.5 2.8",
    "M5 1.2v1.1M2 3.6l.8.8M8 3.6l-.8.8",
    "M4.3 11.5h5.4a2.1 2.1 0 0 0 .2-4.2 3 3 0 0 0-5.7-.7 2.15 2.15 0 0 0 .1 4.9Z",
  ],
  cloud: ["M4.3 11h5.9a2.3 2.3 0 0 0 .2-4.6 3.3 3.3 0 0 0-6.3-.8 2.35 2.35 0 0 0 .2 5.4Z"],
  rain: [
    "M4.3 9h5.9a2.3 2.3 0 0 0 .2-4.6 3.3 3.3 0 0 0-6.3-.8 2.35 2.35 0 0 0 .2 5.4Z",
    "M5 10.4l-.7 1.8M7 10.4l-.7 1.8M9 10.4l-.7 1.8",
  ],
};

export function WeatherGlyph({
  condition,
  color,
  size = 16,
}: {
  condition: WeatherCondition;
  color: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      {WEATHER_PATHS[condition].map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}

const HEART =
  "M7 12.1C3.3 9.4 1.5 7.5 1.5 5.4A3.2 3.2 0 0 1 7 3.5a3.2 3.2 0 0 1 5.5 1.9c0 2.1-1.8 4-5.5 6.7Z";
const THUMB = [
  "M4.3 6.1 6.9 1.5a1.35 1.35 0 0 1 2 1.25V5.5h2.9a1.2 1.2 0 0 1 1.16 1.53l-1.1 3.85A1.5 1.5 0 0 1 10.4 12H4.3Z",
  "M1.3 6.1h2.4V12H1.3Z",
];

export function ReactionGlyph({
  kind,
  mine,
  color,
}: {
  kind: "heart" | "up" | "down";
  mine: boolean;
  color: string;
}) {
  const paths = kind === "heart" ? [HEART] : THUMB;
  return (
    <Svg width={13} height={13} viewBox="0 0 14 14">
      <G transform={kind === "down" ? "rotate(180 7 7)" : undefined}>
        {paths.map((d) => (
          <Path
            key={d}
            d={d}
            fill={mine ? color : "none"}
            stroke={color}
            strokeWidth={mine ? 0 : 1.25}
            strokeLinejoin="round"
          />
        ))}
      </G>
    </Svg>
  );
}

export function UploadGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M7 9.5V2M4 4.7 7 1.7l3 3M2 9.5v1.7c0 .4.3.8.8.8h8.4c.5 0 .8-.4.8-.8V9.5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SlidersGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M2.2 4.4h1.4M6.4 4.4h5.4M2.2 9.6h5.4M10.4 9.6h1.4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Circle cx={5} cy={4.4} r={1.4} stroke={color} strokeWidth={STROKE} />
      <Circle cx={9} cy={9.6} r={1.4} stroke={color} strokeWidth={STROKE} />
    </Svg>
  );
}

export function FileGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path
        d="M3.5 1.5h4l3 3v7.5a.5.5 0 0 1-.5.5h-6.5a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5ZM7.5 1.5v3h3"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SparkGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M7 1.8c.4 2.8 1.4 4 4.2 5.2-2.8 1.2-3.8 2.4-4.2 5.2-.4-2.8-1.4-4-4.2-5.2C5.6 5.8 6.6 4.6 7 1.8Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BulbGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M5.2 10.2h3.6M5.6 12h2.8M7 1.8a3.6 3.6 0 0 0-2.2 6.4c.4.3.5.7.5 1.1v.9h3.4v-.9c0-.4.1-.8.5-1.1A3.6 3.6 0 0 0 7 1.8Z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WishListGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 14 14" fill="none">
      <Path d="M6.6 4.2H12M2.2 7.6H12M2.2 10.8H12" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M3.6 5.6 2.1 4.1a.95.95 0 0 1 1.5-1.2.95.95 0 0 1 1.5 1.2Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    </Svg>
  );
}
