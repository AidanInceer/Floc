import { LineIcon } from "@/components/system/icons";

export function SparkIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <LineIcon size={size} className={className}>
      <path d="M7 1.8c.4 2.8 1.4 4 4.2 5.2-2.8 1.2-3.8 2.4-4.2 5.2-.4-2.8-1.4-4-4.2-5.2C5.6 5.8 6.6 4.6 7 1.8Z" />
    </LineIcon>
  );
}

export function ListIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <LineIcon size={size} className={className}>
      <path d="M5.4 3.6h6.2M5.4 7h6.2M5.4 10.4h6.2M2.6 3.6h.4M2.6 7h.4M2.6 10.4h.4" />
    </LineIcon>
  );
}
