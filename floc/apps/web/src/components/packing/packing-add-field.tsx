"use client";

import { useState } from "react";

import { SubmitButton } from "@/components/system/client-ui";
import { cx } from "@/components/system/ui";
import { PACK_CATEGORIES, PACK_CATEGORY_LABELS, type PackCategory } from "@floc/core/packing/packing";
import { guessPackCategory } from "@floc/core/packing/packing-guess";
import { TEXT_CAPS } from "@floc/core/text/text";

/**
 * The one add field for both packing lists, with its cube beside it.
 * Why: the cube follows Floc's guess from the name until the person picks one,
 * so a wrong guess ("Card game" → Essentials) is fixed before it is added.
 */
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
        "mx-auto flex h-11 w-full max-w-xl items-center gap-1 rounded-sm border border-rule-strong bg-sheet pr-1.5 transition-colors hover:border-ink-faint max-sm:h-12",
        "focus-within:border-transparent focus-within:outline focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-pen",
      )}
    >
      <label className="h-full min-w-0 flex-1">
        <span className="sr-only">{name}</span>
        <input
          name="label"
          required
          maxLength={TEXT_CAPS.packingLabel}
          autoComplete="off"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-full w-full bg-transparent px-4 font-mono text-sm outline-none focus-visible:outline-none"
        />
      </label>
      <label className="shrink-0">
        <span className="sr-only">Cube</span>
        <select
          name="category"
          value={category}
          onChange={(e) => setPicked(e.target.value as PackCategory)}
          className={cx(
            "h-8 rounded-sm bg-transparent px-2 font-mono text-sm outline-none max-sm:h-10",
            "hover:bg-pen-soft hover:text-pen-deep focus-visible:bg-pen-soft focus-visible:text-pen-deep focus-visible:outline-none",
            filled || picked ? "text-ink-soft" : "text-ink-faint",
          )}
        >
          {PACK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {PACK_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton
        variant={filled ? "primary" : "secondary"}
        disabled={!filled}
        className="shrink-0 !px-3 !py-1.5 max-sm:h-10"
      >
        Add
      </SubmitButton>
    </form>
  );
}
