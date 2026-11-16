import { formatBytes } from "@floc/core/documents/documents";

export function StorageMeter({ usedBytes, quotaBytes }: { usedBytes: number; quotaBytes: number }) {
  const share = Math.min(100, (usedBytes / quotaBytes) * 100);
  return (
    <div className="mt-6 flex items-center justify-end gap-3">
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={quotaBytes}
        aria-valuenow={usedBytes}
        aria-label="Space used"
        className="h-1 w-32 overflow-hidden rounded-full bg-rule"
      >
        <div className="h-full rounded-full bg-pen" style={{ width: `${share}%` }} />
      </div>
      <span className="nums font-mono text-[11px] text-ink-soft">
        {formatBytes(usedBytes)} of {formatBytes(quotaBytes)} used
      </span>
    </div>
  );
}
