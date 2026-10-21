/**
 * The Days page's line art: where you sleep, the folded hours, and one glyph
 * per kind of event. Why: the flight path is the app's `flights` category
 * mark, an aeroplane, so a flight reads the same on Days and Money.
 */
import type { DayEventType, TransportType } from "@/db/schema";
import { LineIcon } from "@/components/system/icons";

type Props = { size?: number; className?: string };

export function BedIcon(props: Props) {
  return (
    <LineIcon {...props}>
      <path d="M1.8 11.6V3.2M1.8 8.8h10.4v2.8M1.8 6.6h3.6v2.2M5.4 6.6h5a1.8 1.8 0 0 1 1.8 1.8v.4" />
    </LineIcon>
  );
}

export function FoldIcon(props: Props) {
  return (
    <LineIcon {...props}>
      <path d="M2.4 7h9.2M4.8 2.6 7 4.6l2.2-2M4.8 11.4 7 9.4l2.2 2" />
    </LineIcon>
  );
}

export function NoteIcon(props: Props) {
  return (
    <LineIcon {...props}>
      <path d="M2.6 3.6h8.8M2.6 7h8.8M2.6 10.4h5.2" />
    </LineIcon>
  );
}

export function ChatIcon(props: Props) {
  return (
    <LineIcon {...props}>
      <path d="M2 3h10v6.6H6.4L3.6 12V9.6H2Z" />
    </LineIcon>
  );
}

const EVENT_PATHS = {
  flight:
    "M11.6 2.4a1.1 1.1 0 0 1 0 1.6L9.4 6.2l.8 4.6-1.2 1-1.6-3.8-2 2v1.8l-1 .8-.9-2.3L1 9.4l.8-1h1.8l2-2L1.8 4.8l1-1.2 4.6.8 2.2-2.2a1.1 1.1 0 0 1 1.6 0z",
  train: "M5 1.8h4a2 2 0 0 1 2 2v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3.8a2 2 0 0 1 2-2zM3 6.4h8M5 12.2l1-2M9 12.2l-1-2",
  car: "M2 9.4V7.2l1.3-3a1 1 0 0 1 .9-.6h5.6a1 1 0 0 1 .9.6l1.3 3v2.2H2ZM2 7.2h10M3.4 10.9h2M8.6 10.9h2",
  ferry: "M2.2 8.2h9.6l-1.4 3H3.6ZM4.2 8.2V5.4h5.6v2.8M7 5.4V2.6",
  transport: "M2.4 7h9.2M8 3.4 11.6 7 8 10.6",
  food: "M4.2 1.8v4.2M2.8 1.8v2.6a1.4 1.4 0 0 0 2.8 0V1.8M4.2 6v6.2M10.2 12.2V1.8c-1.4.6-2.2 2-2.2 3.8v1.6h2.2",
  activity: "M1.9 4.2h10.2v1.7a1.1 1.1 0 0 0 0 2.2v1.7H1.9V8.1a1.1 1.1 0 0 0 0-2.2ZM8.6 4.2v5.6",
} as const;

function pathFor(type: DayEventType, transportType: TransportType | null) {
  if (type !== "transport") return EVENT_PATHS[type];
  return transportType && transportType !== "other" ? EVENT_PATHS[transportType] : EVENT_PATHS.transport;
}

export function EventGlyph({
  type,
  transportType,
  ...props
}: Props & { type: DayEventType; transportType: TransportType | null }) {
  return (
    <LineIcon {...props}>
      <path d={pathFor(type, transportType)} />
    </LineIcon>
  );
}
