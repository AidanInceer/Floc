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
