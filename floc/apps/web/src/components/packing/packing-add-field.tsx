"use client";

import { useState } from "react";

import { SubmitButton } from "@/components/system/client-ui";
import { ChevronIcon } from "@/components/system/icons";
import { cx } from "@/components/system/ui";
import { PACK_CATEGORIES, PACK_CATEGORY_LABELS, type PackCategory } from "@floc/core/packing/packing";
import { guessPackCategory } from "@floc/core/packing/packing-guess";
import { TEXT_CAPS } from "@floc/core/text/text";

export function PackingAddField({ add, label: name = "Add to your bag" }: { add: (formData: FormData) => Promise<void>; label?: string }) {
  const [label, setLabel] = useState("");
  const [picked, setPicked] = useState<PackCategory | null>(null);
  const filled = label.trim() !== "";
  const category = picked ?? guessPackCategory(label);
  return (
    <form
      action={async (formData) => {
        await add(formData);
        setLabel("");
        setPicked(null);
      }}
      className={cx(
        "mx-auto flex h-11 w-full max-w-xl items-stretch divide-x divide-rule overflow-hidden rounded-sm border border-rule-strong bg-sheet transition-colors hover:border-ink-faint max-sm:h-12",
        "focus-within:border-transparent focus-within:outline focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-pen",
      )}
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">{name}</span>
        <input
          name="label"
          required
          maxLength={TEXT_CAPS.packingLabel}
          autoComplete="off"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-full w-full bg-transparent px-3 font-mono text-sm outline-none focus-visible:outline-none sm:px-4"
        />
      </label>
      <label className="relative shrink-0">
        <span className="sr-only">Cube</span>
        <select
          name="category"
          value={category}
          onChange={(e) => setPicked(e.target.value as PackCategory)}
          className={cx(
            "peer h-full appearance-none bg-transparent pl-2 pr-6 font-mono text-sm text-ink-2 outline-none sm:pl-3 sm:pr-8",
            "hover:bg-pen-soft hover:text-pen-deep focus-visible:bg-pen-soft focus-visible:text-pen-deep focus-visible:outline-none",
          )}
        >
          {PACK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {PACK_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <ChevronIcon direction="down" size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-2 peer-hover:text-pen-deep peer-focus-visible:text-pen-deep sm:right-3" />
      </label>
      <SubmitButton
        variant={filled ? "primary" : "secondary"}
        disabled={!filled}
        className="h-full shrink-0 !rounded-none !border-0 !px-3 !py-0 !shadow-none hover:!transform-none focus-visible:!bg-pen-deep focus-visible:!outline-none sm:!px-4"
      >
        Add
      </SubmitButton>
    </form>
  );
}
