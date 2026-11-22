"use client";

import { useState } from "react";

import { addIdea } from "@/app/trip/[id]/overview/actions";
import { ChevronIcon } from "@/components/system/icons";
import { busyMark, cx } from "@/components/system/ui";
import { ALL_IDEAS, type IdeaCategoryTab } from "@floc/core/trip/idea-categories";
import { TEXT_CAPS } from "@floc/core/text/text";

export function IdeaAddField({
  tripId,
  tab,
  tabs,
  onAdded,
}: {
  tripId: number;
  tab: string;
  tabs: IdeaCategoryTab[];
  onAdded: (title: string, category: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const category = picked ?? (tab === ALL_IDEAS ? "other" : tab);
  const filled = title.trim() !== "";

  const submit = async (formData: FormData) => {
    setBusy(true);
    setFailed(false);
    try {
      const out = await addIdea(formData);
      if (out?.error) {
        setFailed(true);
        return;
      }
      onAdded(title.trim(), category);
      setTitle("");
      setPicked(null);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      action={submit}
      className={cx(
        "flex h-[31px] min-w-0 items-stretch overflow-hidden rounded-sm border bg-sheet transition-colors focus-within:border-transparent focus-within:outline focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-pen max-sm:h-10",
        failed ? "border-red" : "border-rule-strong hover:border-ink-faint",
      )}
    >
      <input type="hidden" name="tripId" value={tripId} />
      <label className="flex min-w-0 flex-1 items-center">
        <span className={cx("shrink-0 pl-2.5 font-mono text-xs uppercase tracking-[0.06em]", failed ? "text-red" : "text-ink-soft")}>{failed ? "Not saved" : "New idea"}</span>
        <input
          name="title"
          required
          autoComplete="off"
          maxLength={TEXT_CAPS.ideaTitle}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm outline-none focus-visible:outline-none"
        />
      </label>
      <label className="relative flex shrink-0 items-center border-l border-rule text-ink-soft">
        <span className="sr-only">Category</span>
        <select
          name="category"
          value={category}
          onChange={(event) => setPicked(event.target.value)}
          className="h-full max-w-[7.5rem] cursor-pointer appearance-none bg-transparent pl-2.5 pr-7 text-sm text-ink outline-none hover:bg-pen-soft focus-visible:bg-pen-soft focus-visible:outline-none"
        >
          {tabs.filter((option) => option.id !== ALL_IDEAS).map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronIcon direction="down" size={11} className="pointer-events-none absolute right-2" />
      </label>
      <button
        type="submit"
        disabled={!filled || busy}
        aria-busy={busy || undefined}
        className="shrink-0 border-l border-rule px-3 font-mono text-xs uppercase tracking-[0.06em] text-pen-deep transition-colors hover:bg-pen-soft disabled:text-ink-faint disabled:hover:bg-transparent"
      >
        Add{busyMark(busy)}
      </button>
    </form>
  );
}
