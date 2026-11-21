import { LineIcon, type IconProps } from "./index";

export function PinIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M7 12.4s3.8-3.6 3.8-6.6a3.8 3.8 0 0 0-7.6 0c0 3 3.8 6.6 3.8 6.6Z" />
      <path d="M8.3 5.8a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0Z" />
    </LineIcon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <path d="M6 8.2a2.5 2.5 0 0 0 3.6 0l1.7-1.7a2.5 2.5 0 0 0-3.6-3.6l-.7.7" />
      <path d="M8 5.8a2.5 2.5 0 0 0-3.6 0L2.7 7.5a2.5 2.5 0 0 0 3.6 3.6l.7-.7" />
    </LineIcon>
  );
}
