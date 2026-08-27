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
import { packingStatus, packingStatusLabel } from "@/lib/packing";
import type { PackingStatus } from "@/lib/packing";

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
 */
export function PackingLineRow({
  tripId,
  lineId,
  label,
  selectFormId,
  claimants,
  viewerId,
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
  setClaim: (tripId: number, lineId: number, claimed: boolean) => Promise<void>;
  setPacked: (tripId: number, lineId: number, packed: boolean) => Promise<void>;
  remove: (tripId: number, lineId: number) => Promise<void>;
}) {
  const status = packingStatus(claimants);
  const mine = claimants.find((c) => c.userId === viewerId);
  // Any bag actually packed is green, not just a finished line: "1 of 3
  // packed" is progress and should read like it. The word still carries the
  // difference from a finished line, so colour is never doing it alone.
  const anyPacked = claimants.some((c) => c.packedAt !== null);
  const tone = anyPacked ? "agreed" : TONE_BY_STATUS[status];

  return (
    <li className="flex min-h-12 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
      <SelectLineBox formId={selectFormId} lineId={lineId} label={label} />

      {mine ? (
        <form action={setPacked.bind(null, tripId, lineId, !mine.packedAt)}>
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
        {packingStatusLabel(claimants)}
      </Badge>

      {claimants.length > 0 ? (
        <AvatarRow
          size={24}
          people={claimants.map((c) => ({
            name: c.packedAt ? `${c.name} — packed` : c.name,
            avatarUrl: c.avatarUrl,
            tone: c.tone,
          }))}
        />
      ) : null}

      <form action={setClaim.bind(null, tripId, lineId, !mine)}>
        <SubmitButton
          variant={mine ? "ghost" : "secondary"}
          pendingLabel="…"
          className="!shrink-0 !px-3"
        >
          {mine ? "Drop" : "I'll bring it"}
        </SubmitButton>
      </form>

      <form action={remove.bind(null, tripId, lineId)}>
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
