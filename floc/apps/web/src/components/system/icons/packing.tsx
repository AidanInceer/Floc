import { LineIcon } from "@/components/system/icons";

/** Auto packing's mark (#469): ideas and the lines taken from them. Always beside a word, never alone. */
export function SparkIcon({ size = 11, className }: { size?: number; className?: string }) {
  return (
    <LineIcon size={size} className={className}>
      <path d="M7 1.8c.4 2.8 1.4 4 4.2 5.2-2.8 1.2-3.8 2.4-4.2 5.2-.4-2.8-1.4-4-4.2-5.2C5.6 5.8 6.6 4.6 7 1.8Z" />
    </LineIcon>
  );
}

/** Only you can see it: always beside the words "Only you". */
export function LockIcon({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <LineIcon size={size} className={className}>
      <rect x="3" y="6.2" width="8" height="5.8" rx="1.4" />
      <path d="M4.8 6.2V4.6a2.2 2.2 0 0 1 4.4 0v1.6" />
    </LineIcon>
  );
}

/** A saved list. */
export function ListIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <LineIcon size={size} className={className}>
      <path d="M5.4 3.6h6.2M5.4 7h6.2M5.4 10.4h6.2M2.6 3.6h.4M2.6 7h.4M2.6 10.4h.4" />
    </LineIcon>
  );
}
