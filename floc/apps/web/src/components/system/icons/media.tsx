import { LineIcon, type IconProps } from "./index";

export function PlayIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M4.4 2.8v8.4L11 7Z" fill="currentColor" />
    </LineIcon>
  );
}

export function BinIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M2.6 3.8h8.8M5.4 3.8V2.4h3.2v1.4M3.6 3.8l.6 8h5.6l.6-8" />
    </LineIcon>
  );
}
