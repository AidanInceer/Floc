import type { AdviceTopic } from "@floc/core/trip/explore/detail/preset-detail-types";

import { LineIcon } from "@/components/system/icons";

type IconProps = { size?: number; className?: string };

export function StarIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M7 1.8l1.5 3.4 3.7.3-2.8 2.4.9 3.6L7 9.9 3.7 11.5l.9-3.6L1.8 5.5l3.7-.3Z" />
    </LineIcon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <rect x="4.4" y="4.4" width="7.8" height="7.8" rx="1.4" />
      <path d="M9.6 4.4V3a1.2 1.2 0 0 0-1.2-1.2H3A1.2 1.2 0 0 0 1.8 3v5.4A1.2 1.2 0 0 0 3 9.6h1.4" />
    </LineIcon>
  );
}

const ADVICE_PATHS: Record<AdviceTopic, string[]> = {
  before: ["M1.8 4.2v6.4a1.2 1.2 0 0 0 1.2 1.2h8a1.2 1.2 0 0 0 1.2-1.2V5.4a1.2 1.2 0 0 0-1.2-1.2H6.9L5.7 2.6H3a1.2 1.2 0 0 0-1.2 1.2Z"],
  money: ["M7 1.8a5.2 5.2 0 1 0 0 10.4A5.2 5.2 0 0 0 7 1.8Z", "M8.6 5.2c-.4-.6-1-.9-1.7-.9-1 0-1.7.5-1.7 1.3 0 1.9 3.6.9 3.6 2.9 0 .8-.8 1.4-1.9 1.4-.8 0-1.5-.3-1.9-1M7 3.4v7.2"],
  transport: ["M4.8 1.8h4.4A1.8 1.8 0 0 1 11 3.6v4.8a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 8.4V3.6a1.8 1.8 0 0 1 1.8-1.8Z", "M3 6.4h8M5 12.2l1-2M9 12.2l-1-2"],
  customs: ["M5.2 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z", "M1.8 11.4c0-1.9 1.5-3 3.4-3s3.4 1.1 3.4 3", "M9.4 3.3a2 2 0 0 1 0 3.9M9.8 8.6c1.5.2 2.6 1.2 2.6 2.8"],
  health: ["M7 12S2 9 2 5.4a2.7 2.7 0 0 1 5-1.4 2.7 2.7 0 0 1 5 1.4C12 9 7 12 7 12Z"],
  weather: ["M5.1 2.7a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z", "M5.1 1.2v.8M1.6 4.7h.8M7.8 4.7h.8", "M6.2 11.9a2.4 2.4 0 0 1 .3-4.8 3.1 3.1 0 0 1 5.8 1.2 1.9 1.9 0 0 1-.5 3.6Z"],
};

export function AdviceIcon({ topic, ...props }: IconProps & { topic: AdviceTopic }) {
  return (
    <LineIcon {...props}>
      {ADVICE_PATHS[topic].map((d) => (
        <path key={d} d={d} />
      ))}
    </LineIcon>
  );
}
