"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import type { AvatarIcon } from "@floc/core/people/avatar-icon";

import { Avatar, cx, panelFieldClass } from "@/components/system/ui";
import { ActionForm, useFormPending } from "@/components/system/client-ui";

export type Face = { name: string; icon: AvatarIcon | null; tone?: string };

function grow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  // Why: scrollHeight leaves out the border, so without it the box is 2px short and shows a scrollbar.
  el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
}

function PostButton({ empty }: { empty: boolean }) {
  const pending = useFormPending();
  return (
    <button
      type="submit"
      disabled={empty || pending}
      aria-busy={pending}
      className="absolute right-1 bottom-1 h-7 rounded-sm px-2 text-sm font-semibold text-pen transition-colors hover:bg-pen-soft hover:text-pen-deep disabled:bg-transparent disabled:text-ink-faint max-sm:h-9"
    >
      Post
    </button>
  );
}

/**
 * One line that grows as you type, with Post inside it (event comments D). Enter posts,
 * Shift+Enter breaks the line. Keeps the words on a refusal, clears them once posted.
 */
export function NoteComposer({
  me,
  label,
  post,
  reply,
  onDone,
}: {
  me: Face;
  /** Names the field for a screen reader; the field itself starts empty. */
  label: string;
  post: (formData: FormData) => Promise<{ error?: string } | void>;
  reply?: boolean;
  onDone?: () => void;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  const sending = useRef(false);
  const [empty, setEmpty] = useState(true);

  const send = async (formData: FormData) => {
    sending.current = true;
    const result = await post(formData).finally(() => {
      sending.current = false;
    });
    if (result?.error) return result;
    if (field.current) {
      field.current.value = "";
      grow(field.current);
    }
    setEmpty(true);
    onDone?.();
    return result;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    // Why: the words stay in the field until the post lands, so a second Enter would post them twice.
    if (sending.current || !e.currentTarget.value.trim()) return;
    e.currentTarget.form?.requestSubmit();
  };

  return (
    <ActionForm action={send} keepAnswers errorClassName={reply ? "mt-1 ml-[30px]" : "mt-1.5 ml-[36px]"}>
      <div className="flex items-center gap-2.5">
        <Avatar name={me.name} tone={me.tone} size={reply ? 20 : 26} />
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={field}
            name="body"
            rows={1}
            maxLength={2000}
            aria-label={label}
            autoFocus={reply}
            onKeyDown={onKeyDown}
            onInput={(e) => {
              grow(e.currentTarget);
              setEmpty(!e.currentTarget.value.trim());
            }}
            className={cx(panelFieldClass, "max-h-40 resize-none overflow-auto pr-16 max-sm:py-[11px]")}
          />
          <PostButton empty={empty} />
        </div>
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="px-0.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:text-pen max-sm:h-9"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </ActionForm>
  );
}
