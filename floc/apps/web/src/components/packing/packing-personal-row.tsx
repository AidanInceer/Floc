"use client";

import { useOptimistic } from "react";

import { Badge, cx } from "@/components/system/ui";
import { clampPackQuantity } from "@floc/core/packing/packing";
import { InlineRename } from "@/components/system/inline-rename";
import { TEXT_CAPS } from "@floc/core/text/text";
import { squareButton } from "@/components/packing/packing-glyphs";
import { PackTick } from "@/components/packing/pack-tick";
import { SparkIcon } from "@/components/system/icons/packing";
import { CrossIcon } from "@/components/system/icons";
import { PackingStepper } from "@/components/packing/packing-quantity";

export function PersonalPackingRow({
  tripId,
  lineId,
  label,
  quantity,
  packedAt,
  setPacked,
  step,
  remove,
  rename,
  compact = false,
  suggested = false,
}: {
  tripId: number;
  lineId: number;
  label: string;
  quantity: number;
  packedAt: Date | null;
  setPacked: (tripId: number, lineId: number, packed: boolean) => Promise<void>;
  step: (tripId: number, lineId: number, formData: FormData) => Promise<void>;
  remove: (tripId: number, lineId: number) => Promise<void>;
  rename: (tripId: number, lineId: number, label: string) => Promise<{ error?: string }>;
  compact?: boolean;
  suggested?: boolean;
}) {
  const [packed, showPacked] = useOptimistic(packedAt !== null);
  const [shown, stepShown] = useOptimistic(quantity, (n: number, delta: number) =>
    clampPackQuantity(n + delta),
  );
  const [gone, showGone] = useOptimistic<boolean, void>(false, () => true);

  if (gone) return null;

  return (
    <li className="flex min-h-12 items-center gap-1.5 px-3 py-2 sm:gap-3 sm:px-4">
      <form
        action={async () => {
          showPacked(!packed);
          await setPacked(tripId, lineId, !packed);
        }}
      >
        <PackTick packed={packed} label={label} />
      </form>

      <span
        className={cx("flex min-w-0 flex-1 items-baseline whitespace-pre text-sm transition-colors duration-[0.22s] ease-(--ease)", packed && "text-ink-soft")}
      >
        <span className="shrink-0 font-mono tabular-nums text-ink-faint">{shown}</span>
        <span className="shrink-0 text-ink-faint">{" — "}</span>
        <InlineRename
          value={label}
          label={`Rename ${label}`}
          maxLength={TEXT_CAPS.packingLabel}
          save={(next) => rename(tripId, lineId, next)}
        />
        {suggested ? (
          <span role="img" aria-label="Suggested" title="Suggested" className="ml-1.5 inline-flex shrink-0 self-center text-pen/60">
            <SparkIcon size={10} />
          </span>
        ) : null}
      </span>

      {!compact ? (
        <span className="hidden shrink-0 sm:block">
          <Badge tone={packed ? "agreed" : "open"} className="whitespace-nowrap">
            {packed ? "Packed" : "Not packed"}
          </Badge>
        </span>
      ) : null}

      <PackingStepper
        shown={shown}
        label={label}
        onStep={stepShown}
        step={step.bind(null, tripId, lineId)}
      />

      <form
        action={async () => {
          showGone();
          await remove(tripId, lineId);
        }}
      >
        <button
          type="submit"
          aria-label={`Remove ${label}`}
          title={`Remove ${label}`}
          className={cx(squareButton, "inline-flex items-center justify-center rounded-sm text-ink-faint hover:bg-red-soft hover:text-red")}
        >
          <CrossIcon />
        </button>
      </form>
    </li>
  );
}
