"use client";

import Link from "next/link";

import { Menu, SubmitButton } from "@/components/system/client-ui";
import { ChevronIcon } from "@/components/system/icons";
import { ListIcon, SparkIcon } from "@/components/system/icons/packing";
import { buttonClass, cx, menuItemClass } from "@/components/system/ui";
import { PACK_TIERS, PACK_TIER_LABELS, type PackTier } from "@floc/core/packing/packing";

export type FillAuto = {
  tier: PackTier;
  ideaCount: number;
  setTier: (formData: FormData) => Promise<void>;
  addAll: () => Promise<void>;
};

type Kit = { id: number; name: string; itemCount: number };

const panel = "w-[19rem] max-w-[calc(100vw-2rem)] rounded-md border border-rule-strong bg-sheet p-1 shadow-raised";
const rule = "my-1 border-t border-rule";

function SavedLists({ kits, apply }: { kits: Kit[]; apply: (kitId: number) => Promise<void> }) {
  return (
    <div>
      <p className="px-2.5 pb-0.5 pt-1.5 text-[11px] text-ink-faint">Packing lists</p>
      {kits.map((kit) => (
        <form key={kit.id} action={apply.bind(null, kit.id)}>
          <SubmitButton variant="ghost" className={cx(menuItemClass, "!flex w-full items-center gap-2.5 !text-ink")}>
            <ListIcon className="text-ink-faint" />
            <span className="min-w-0 flex-1 truncate">{kit.name}</span>
            <span className="font-mono text-[11px] tabular-nums text-ink-faint">{kit.itemCount}</span>
          </SubmitButton>
        </form>
      ))}
      <Link role="menuitem" href="/lists/packing" className={menuItemClass}>
        {kits.length > 0 ? "Manage your lists" : "Make your first list"}
      </Link>
    </div>
  );
}

/** Why: the panel closes on any submit, and a tier is a setting you change, then Add all — so it stops here. */
function TierTrack({ tier, setTier }: Pick<FillAuto, "tier" | "setTier">) {
  return (
    <form action={setTier} onSubmit={(e) => e.stopPropagation()} className="flex gap-0.5 rounded-md bg-sheet-3 p-1" aria-label="How you pack">
      {PACK_TIERS.map((t) => (
        <button
          key={t}
          type="submit"
          name="packTier"
          value={t}
          aria-pressed={t === tier}
          className={cx(
            "flex-1 rounded-sm py-1 text-[13px] transition-colors",
            t === tier ? "bg-sheet text-ink shadow-card" : "text-ink-soft hover:text-ink",
          )}
        >
          {PACK_TIER_LABELS[t]}
        </button>
      ))}
    </form>
  );
}

function AutoPart({ auto }: { auto: FillAuto | null }) {
  if (!auto) {
    return (
      <div className="p-1.5">
        <Link href="/settings?section=billing" className={cx(buttonClass("pro"), "w-full !py-2")}>
          <SparkIcon />
          Auto pack
          <span className="font-semibold">Pro</span>
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-2.5 p-1.5">
      <TierTrack tier={auto.tier} setTier={auto.setTier} />
      <form action={auto.addAll}>
        <SubmitButton variant="secondary" disabled={auto.ideaCount === 0} className="w-full !py-2">
          {auto.ideaCount > 0 ? <>Add all <span className="tabular-nums">{auto.ideaCount}</span></> : "All added"}
        </SubmitButton>
      </form>
    </div>
  );
}

/**
 * Every way to fill your bag but typing, behind one button (E2,
 * wireframe/packing-bag-top): your saved lists, then how you pack and Add all.
 * Free gets one Auto pack button in place of the auto part.
 */
export function PackingFillMenu({
  kits,
  apply,
  auto,
}: {
  kits: Kit[];
  apply: (kitId: number) => Promise<void>;
  /** Null on Free. */
  auto: FillAuto | null;
}) {
  return (
    <Menu
      label="Fill your bag"
      trigger={
        <>
          Fill your bag
          <ChevronIcon direction="down" size={11} />
        </>
      }
      triggerClassName={cx(buttonClass(), "shrink-0 whitespace-nowrap data-[open=true]:bg-pen-soft data-[open=true]:text-pen-deep")}
      panelClassName={panel}
    >
      <SavedLists kits={kits} apply={apply} />
      <div className={rule} />
      <AutoPart auto={auto} />
    </Menu>
  );
}
