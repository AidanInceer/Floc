"use client";

import { PACK_CATEGORY_LABELS, packingStatusLabel, type PackCategory } from "@floc/core/packing/packing";
import type { AvatarIcon } from "@floc/core/people/avatar-icon";
import { TEXT_CAPS } from "@floc/core/text/text";

import { ConfirmSubmit, Menu, SubmitButton } from "@/components/system/client-ui";
import { InlineRename } from "@/components/system/inline-rename";
import { menuDangerItemClass, menuItemClass } from "@/components/system/ui";
import { CheckGlyph, SelectLineBox, tickBoxBase, tickBoxClass } from "@/components/packing/packing-glyphs";

export type PackingClaimant = {
  userId: string;
  name: string;
  avatarIcon: AvatarIcon | null;
  tone?: string;
  packedAt: Date | null;
};

type Actions = {
  claim: (tripId: number, lineId: number, claimed: boolean) => Promise<void>;
  pack: (tripId: number, lineId: number, packed: boolean) => Promise<void>;
  remove: (tripId: number, lineId: number) => Promise<void>;
  rename: (tripId: number, lineId: number, label: string) => Promise<{ error?: string }>;
};

function claimStatus(claimants: PackingClaimant[], personClaim: PackingClaimant | null | undefined) {
  if (claimants.length === 0) return null;
  if (!personClaim) {
    const label = `${claimants.map((c) => c.name).join(", ")} · ${packingStatusLabel(claimants)}`;
    return { short: label, full: label };
  }
  const status = personClaim.packedAt ? "Packed" : "Not packed";
  const others = claimants.filter((c) => c.userId !== personClaim.userId).map((c) => c.name);
  return {
    short: `${status}${others.length ? ` · +${others.length}` : ""}`,
    full: `${status}${others.length ? ` · with ${others.join(", ")}` : ""}`,
  };
}

export function PackingClaimCard({
  tripId,
  line,
  claimants,
  personId,
  viewerId,
  selectFormId,
  actions,
}: {
  tripId: number;
  line: { id: number; label: string; category: PackCategory };
  claimants: PackingClaimant[];
  personId: string | null;
  viewerId: string;
  selectFormId: string | null;
  actions: Actions;
}) {
  const personClaim = personId ? claimants.find((c) => c.userId === personId) : null;
  const viewerClaim = claimants.find((c) => c.userId === viewerId);
  const open = claimants.length === 0;
  const packed = Boolean(personClaim?.packedAt);
  const status = claimStatus(claimants, personClaim);

  return (
    <li className="flex min-h-11 min-w-0 items-center gap-2 px-3 py-2">
        <SelectLineBox formId={selectFormId} lineId={line.id} label={line.label} />
        {personId === viewerId && personClaim ? (
          <form action={actions.pack.bind(null, tripId, line.id, !packed)}>
            <button
              type="submit"
              aria-label={packed ? `Unpack ${line.label}` : `Mark ${line.label} packed`}
              className={`${tickBoxBase} ${tickBoxClass(packed)}`}
            >
              <CheckGlyph />
            </button>
          </form>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-sm leading-snug">
          <InlineRename
            value={line.label}
            label={`Rename ${line.label}`}
            maxLength={TEXT_CAPS.packingLabel}
            save={(next) => actions.rename(tripId, line.id, next)}
          />
        </span>
        <span className="shrink-0 border-l border-rule pl-2 text-[11px] text-ink-soft">
          {PACK_CATEGORY_LABELS[line.category]}
        </span>
        {open ? (
          <form action={actions.claim.bind(null, tripId, line.id, true)} className="shrink-0">
            <SubmitButton variant="secondary" pendingLabel="Claiming…" className="!px-2 !py-1">
              I’ll bring it
            </SubmitButton>
          </form>
        ) : status ? (
          <span className="max-w-28 shrink truncate text-[11px] text-ink-soft" title={status.full}>
            {status.short}
          </span>
        ) : null}
        <Menu label={`More for ${line.label}`}>
          {!open ? (
            <form action={actions.claim.bind(null, tripId, line.id, !viewerClaim)}>
              <SubmitButton variant="ghost" pendingLabel="…" className={menuItemClass}>
                {viewerClaim ? "Drop it" : "I'll bring one too"}
              </SubmitButton>
            </form>
          ) : null}
          <form action={actions.remove.bind(null, tripId, line.id)}>
            <ConfirmSubmit
              variant="ghost"
              confirmVariant="danger"
              label={`Remove ${line.label}`}
              message={`Remove "${line.label}" from the shared list?`}
              confirmLabel="Remove it"
              className={menuDangerItemClass}
            >
              Remove for everyone
            </ConfirmSubmit>
          </form>
        </Menu>
    </li>
  );
}
