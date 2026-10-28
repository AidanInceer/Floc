"use client";

/**
 * Why: name and picture save together so the card can preview the draft (C3b, #157 for the faces).
 * No colour choice: `whoTone` is how you follow one member across Money, Packing and the itinerary.
 */
import { useEffect, useRef, useState } from "react";

import {
  AVATAR_ICONS,
  AVATAR_ICON_LABELS,
  type AvatarIcon,
} from "@floc/core/people/avatar-icon";
import { initials } from "@floc/core/people/initials";

import { updateFace } from "@/app/profile/actions";
import { AvatarIconMark } from "@/components/system/avatar-icon";
import { SubmitButton } from "@/components/system/client-ui";
import { PencilIcon } from "@/components/system/icons";
import { Avatar, Button, ErrorText, Field, Input, cx } from "@/components/system/ui";

function FaceGrid({
  name,
  picked,
  onPick,
}: {
  name: string;
  picked: AvatarIcon | null;
  onPick: (icon: AvatarIcon | null) => void;
}) {
  const options: (AvatarIcon | null)[] = [null, ...AVATAR_ICONS];
  return (
    <div role="group" aria-label="Picture" className="grid grid-cols-[repeat(6,44px)] justify-between gap-y-3">
      {options.map((icon) => {
        const on = icon === picked;
        const label = icon ? AVATAR_ICON_LABELS[icon] : "Your initials";
        // Why: an ink border, not PickOption's pen ring — the card above already shows the pick (C3b).
        return (
          <button
            key={icon ?? "initials"}
            type="button"
            aria-pressed={on}
            aria-label={label}
            title={label}
            onClick={() => onPick(icon)}
            className={cx(
              "inline-flex size-11 items-center justify-center rounded-full font-mono text-sm font-semibold transition-colors",
              on
                ? "border-[1.5px] border-ink bg-sheet text-ink"
                : "border border-rule-strong bg-sheet-2 text-ink-soft hover:border-ink-soft hover:text-ink",
            )}
          >
            {icon ? <AvatarIconMark icon={icon} size={20} /> : initials(name || "?")}
          </button>
        );
      })}
    </div>
  );
}

export function FaceEditor({
  name,
  icon,
  been,
  wantToGo,
}: {
  name: string;
  icon: AvatarIcon | null;
  been: number;
  wantToGo: number;
}) {
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftIcon, setDraftIcon] = useState(icon);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setDraftName(name);
    setDraftIcon(icon);
    setError(null);
    setOpen(true);
  };
  const cancel = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    fieldRef.current?.select();
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const save = async (formData: FormData) => {
    const result = await updateFace(formData);
    if (result.error) setError(result.error);
    else setOpen(false);
  };

  const shownName = open ? draftName.trim() || name : name;
  const shownIcon = open ? draftIcon : icon;

  return (
    <div ref={wrapRef} className={cx("relative min-w-0", open && "z-[1200]")}>
      <button
        type="button"
        onClick={() => (open ? cancel() : start())}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Change your name and picture, ${name}`}
        className="-m-1.5 flex min-w-0 items-center gap-4 rounded-lg p-1.5 text-left transition-colors hover:bg-sheet-2"
      >
        <span className="relative shrink-0">
          <Avatar name={shownName} icon={shownIcon} size={64} />
          <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-[22px] items-center justify-center rounded-full border border-rule-strong bg-sheet text-ink-soft">
            <PencilIcon size={11} />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block font-display text-2xl font-semibold break-words text-ink">{shownName}</span>
          <span className="nums mt-1 block text-sm text-ink-soft">
            {been} been · {wantToGo} want to go
          </span>
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Your name and picture"
          className="fixed inset-x-0 bottom-0 rounded-t-lg border border-rule bg-sheet p-4 shadow-lift sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-3 sm:w-[356px] sm:rounded-lg"
        >
          <form action={save} className="flex flex-col gap-3.5">
            <Field label="Name">
              <Input
                ref={fieldRef}
                name="displayName"
                value={draftName}
                onChange={(e) => {
                  setDraftName(e.target.value);
                  setError(null);
                }}
                autoComplete="name"
                maxLength={80}
                className="text-base"
              />
            </Field>
            <ErrorText>{error}</ErrorText>
            <input type="hidden" name="avatarIcon" value={draftIcon ?? ""} />
            <FaceGrid name={draftName.trim() || name} picked={draftIcon} onPick={setDraftIcon} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={cancel}>
                Cancel
              </Button>
              <SubmitButton variant="primary" pendingLabel="Saving…">
                Save
              </SubmitButton>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
