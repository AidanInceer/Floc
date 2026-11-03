import { LineIcon } from "@/components/system/icons";

/** Auto packing's mark (#469): ideas and the lines taken from them. Always beside a word, never alone. */
export function SparkIcon({ size = 11, className }: { size?: number; className?: string }) {
  return (
    <LineIcon size={size} className={className}>
      <path d="M7 1.8c.4 2.8 1.4 4 4.2 5.2-2.8 1.2-3.8 2.4-4.2 5.2-.4-2.8-1.4-4-4.2-5.2C5.6 5.8 6.6 4.6 7 1.8Z" />
    </LineIcon>
  );
}
