"use client";

import { useOptimistic } from "react";

import { AvatarRow, Badge, cx } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import {
  CheckGlyph,
  CrossGlyph,
  SelectLineBox,
  squareButton,
  tickBoxBase,
  tickBoxClass,
} from "@/components/packing-glyphs";
import { packingStatus, packingStatusLabel } from "@floc/core/packing";
import type { PackingStatus } from "@floc/core/packing";

export type PackingClaimant = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  tone?: string;
  packedAt: Date | null;
};

const TONE_BY_STATUS: Record<PackingStatus, "agreed" | "marine" | "open"> = {
  packed: "agreed",
  claimed: "marine",
  unclaimed: "open",
};

/**
 * One thing on the shared list (ticket 219). Reads as a checklist: the tick box
 * leads the row and belongs to the viewer's own claim, so the only two verbs
 * left on the right are joining the line and removing it. The tick slot holds
 * its width when the viewer hasn't claimed, so every label starts on one line.
 *
 * `min-h-12`, not padding alone: the first row carries no top rule, so on
 * padding alone it sat a pixel proud of every row under it and any row you
 * touched read as having shifted. `border-box` folds the rule into the 12.
 *
 * The verbs a viewer gets are decided by whether they've claimed it, not by who
 * typed it: claim/unclaim is open to anyone, ticking is the claimer's alone.
 *
 * A Client Component so the three verbs land under the finger. Every write here
 * revalidates the whole tab — both lists, the roster, the forecast — and a row
 * that sits inert until all of that returns reads as a dead control. The
 * optimism is applied to the claimant list, not to each mark separately, so the
 * tick, the word and the avatars can never disagree mid-flight; the server's
 * answer overwrites it, so a refused write corrects itself.
 */
export function PackingLineRow({
  tripId,
  lineId,
  label,
  selectFormId,
  claimants,
  viewerId,
  viewer,
  setClaim,
  setPacked,
  remove,
}: {
  tripId: number;
  lineId: number;
  label: string;
  /** The bulk-remove form this row's select box belongs to, or null when not selecting (ticket 229). */
  selectFormId: string | null;
  claimants: PackingClaimant[];
  viewerId: string;
  /** The viewer's own name and avatar, so claiming can draw their pill before the server confirms it. */
  viewer: { name: string; avatarUrl: string | null; tone?: string };
  setClaim: (tripId: number, lineId: number, claimed: boolean) => Promise<void>;
  setPacked: (tripId: number, lineId: number, packed: boolean) => Promise<void>;
  remove: (tripId: number, lineId: number) => Promise<void>;
}) {
  const [shown, patch] = useOptimistic(claimants, applyToViewer);
  const [gone, showGone] = useOptimistic<boolean, void>(false, () => true);

  const status = packingStatus(shown);
  const mine = shown.find((c) => c.userId === viewerId);
  // Any bag actually packed is green, not just a finished line: "1 of 3
  // packed" is progress and should read like it. The word still carries the
  // difference from a finished line, so colour is never doing it alone.
  const anyPacked = shown.some((c) => c.packedAt !== null);
  const tone = anyPacked ? "agreed" : TONE_BY_STATUS[status];

  // The row goes before the delete lands, and the re-render that lands drops it
  // for real. Nothing to fade: a confirmed removal is already deliberate.
  if (gone) return null;

  return (
    <li className="flex min-h-12 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
      <SelectLineBox formId={selectFormId} lineId={lineId} label={label} />

      {mine ? (
        <form
          action={async () => {
            const packed = mine.packedAt === null;
            patch({ kind: "packed", viewerId, packed });
            await setPacked(tripId, lineId, packed);
          }}
        >
          {/* Deliberately not `Button`/`SubmitButton`: both carry `lift`, whose
              hover transform replays on the fresh element the action re-renders
              and reads as a bounce, and `SubmitButton` swaps the glyph out for
              its pending label mid-flight. A tick box should sit still
              (ticket 219). Same box, same 1px border, colours only. */}
          <button
            type="submit"
            aria-label={mine.packedAt ? `Unpack ${label}` : `Mark ${label} packed`}
            className={cx(tickBoxBase, tickBoxClass(mine.packedAt !== null))}
          >
            <CheckGlyph />
          </button>
        </form>
      ) : (
        <span className="size-7 shrink-0" aria-hidden />
      )}

      <span
        className={cx(
          "min-w-0 flex-1 truncate text-sm",
          status === "packed" && "text-ink-soft",
        )}
      >
        {label}
      </span>

      <Badge tone={tone} className="shrink-0 whitespace-nowrap">
        {packingStatusLabel(shown)}
      </Badge>

      {shown.length > 0 ? (
        <AvatarRow
          size={24}
          people={shown.map((c) => ({
            name: c.packedAt ? `${c.name} — packed` : c.name,
            avatarUrl: c.avatarUrl,
            tone: c.tone,
          }))}
        />
      ) : null}

      <form
        action={async () => {
          patch({ kind: "claim", viewerId, claimed: !mine, viewer });
          await setClaim(tripId, lineId, !mine);
        }}
      >
        <SubmitButton
          variant={mine ? "ghost" : "secondary"}
          pendingLabel="…"
          className="!shrink-0 !px-3"
        >
          {mine ? "Drop" : "I'll bring it"}
        </SubmitButton>
      </form>

      <form
        action={async () => {
          showGone();
          await remove(tripId, lineId);
        }}
      >
        <ConfirmSubmit
          variant="ghost"
          confirmVariant="danger"
          label={`Remove ${label}`}
          message={`Remove "${label}" from the shared list?`}
          confirmLabel="Remove it"
          className={cx(
            squareButton,
            "!text-ink-faint hover:!bg-red-soft hover:!text-red",
          )}
        >
          <CrossGlyph />
        </ConfirmSubmit>
      </form>
    </li>
  );
}

/**
 * Every verb on this row changes exactly one claimant — the viewer's own — so
 * one reducer covers all of them. Written as a reducer rather than a set value
 * because two presses before the first render commits both close over the same
 * list, and a set would show one of them.
 */
type ClaimPatch =
  | { kind: "packed"; viewerId: string; packed: boolean }
  | {
      kind: "claim";
      viewerId: string;
      claimed: boolean;
      viewer: { name: string; avatarUrl: string | null; tone?: string };
    };

function applyToViewer(
  claimants: PackingClaimant[],
  patch: ClaimPatch,
): PackingClaimant[] {
  if (patch.kind === "packed") {
    return claimants.map((c) =>
      c.userId === patch.viewerId
        ? { ...c, packedAt: patch.packed ? new Date() : null }
        : c,
    );
  }
  // Dropped first even when claiming: two presses before the first render
  // commits both see no claim of yours and both add one, and a doubled pill
  // reads as "0 of 2 packed" on a line one person has taken.
  const others = claimants.filter((c) => c.userId !== patch.viewerId);
  if (!patch.claimed) return others;
  return [...others, { userId: patch.viewerId, ...patch.viewer, packedAt: null }];
}
