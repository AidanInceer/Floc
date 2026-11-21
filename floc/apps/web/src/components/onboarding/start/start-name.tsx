"use client";

import { TEXT_CAPS } from "@floc/core/text/text";

import { AvatarRow, Field, Input } from "@/components/system/ui";

export function StartName({ name, onName, where, when, who }: {
  name: string;
  onName: (name: string) => void;
  where: string;
  when: string;
  who: string[];
}) {
  return (
    <div className="grid gap-4">
      <div className="grid rounded-md border border-rule bg-sheet-2 px-4 pb-1 pt-3">
        <p className="min-h-8 font-display text-lg text-ink [overflow-wrap:anywhere]">{name.trim() || <span className="text-ink-faint">Your trip</span>}</p>
        <dl className="grid">
        {[
          ["Where", where],
          ["When", when],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center gap-3 border-t border-rule py-2 text-sm first-of-type:border-t-0">
            <dt className="typed w-14 shrink-0">{label}</dt>
            <dd className={label === "When" ? "min-w-0 font-mono text-ink" : "min-w-0 text-ink"}>{value}</dd>
          </div>
        ))}
        <div className="flex items-center gap-3 border-t border-rule py-2 text-sm">
          <dt className="typed w-14 shrink-0">Who</dt>
          <dd><AvatarRow people={who.map((n) => ({ name: n }))} size={26} max={8} spaced /></dd>
        </div>
        </dl>
      </div>
      <Field label="Name">
        <Input name="name" required maxLength={TEXT_CAPS.tripName} autoComplete="off" value={name} onChange={(event) => onName(event.target.value)} />
      </Field>
    </div>
  );
}
