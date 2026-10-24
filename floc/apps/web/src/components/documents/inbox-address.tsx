import { CopyLink } from "@/components/system/client-ui";

export function InboxAddress({ address }: { address: string }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-rule bg-sheet px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-soft">Forward a booking email here. Its attachments land in Yours.</p>
        <p className="mt-0.5 break-all font-mono text-[13px] text-ink">{address}</p>
      </div>
      <CopyLink value={address} label="Copy address" variant="secondary" />
    </div>
  );
}
