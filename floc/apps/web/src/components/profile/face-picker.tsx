/**
 * Choose your icon (#157). Tapping your own avatar opens the grid; tapping a
 * cell saves and closes.
 *
 * SAVES ON TAP, SO IT HOLDS NOTHING ELSE. A name field in here could not
 * submit on click without committing a half-typed name, which is why the name
 * stays on the form and this sheet does one thing.
 *
 * The colour is not offered. It comes from `whoTone`, and letting people pick
 * it would break following one member across Money, Packing and the itinerary.
 */
import {
  AVATAR_ICONS,
  AVATAR_ICON_LABELS,
  type AvatarIcon,
} from "@floc/core/people/avatar-icon";

import { setAvatarIcon } from "@/app/profile/actions";
import { AvatarIconMark } from "@/components/system/avatar-icon";
import { Sheet } from "@/components/system/client-ui";
import { Avatar, cx } from "@/components/system/ui";
import { initials } from "@floc/core/people/initials";

function Cell({
  name,
  icon,
  selected,
}: {
  name: string;
  icon: AvatarIcon | null;
  selected: boolean;
}) {
  const label = icon ? AVATAR_ICON_LABELS[icon] : "Your initials";
  return (
    <form action={setAvatarIcon}>
      <input type="hidden" name="avatarIcon" value={icon ?? ""} />
      <button
        type="submit"
        title={label}
        aria-label={label}
        aria-pressed={selected}
        className={cx(
          "inline-flex size-11 items-center justify-center rounded-full border bg-sheet-2 font-mono text-sm font-semibold text-ink-soft transition-shadow hover:ring-2 hover:ring-pen",
          selected ? "border-pen ring-2 ring-pen" : "border-rule-strong",
        )}
      >
        {icon ? <AvatarIconMark icon={icon} size={20} /> : initials(name)}
      </button>
    </form>
  );
}

export function FacePicker({
  name,
  icon,
}: {
  name: string;
  icon: AvatarIcon | null;
}) {
  return (
    <Sheet
      title="Choose your icon"
      bareTrigger
      triggerLabel="Change your picture"
      triggerClassName="rounded-full ring-offset-2 ring-offset-pastel-yellow transition-shadow hover:ring-2 hover:ring-pen"
      trigger={<Avatar name={name} icon={icon} size={64} />}
    >
      {/* Content-width columns, not 1fr: equal-fraction tracks are wider than
          the cell, so the horizontal gaps read bigger than the vertical ones. */}
      <div className="grid grid-cols-[repeat(6,auto)] justify-center gap-3">
        <Cell name={name} icon={null} selected={icon === null} />
        {AVATAR_ICONS.map((option) => (
          <Cell
            key={option}
            name={name}
            icon={option}
            selected={icon === option}
          />
        ))}
      </div>
    </Sheet>
  );
}
